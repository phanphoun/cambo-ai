"""Document generation engine for creating publication-grade PDF, Word (.docx), Markdown, and CSV documents with full Khmer Unicode & Table support."""
import os
import io
import re
import time
import uuid
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

logger = logging.getLogger("cambo.services.doc_generator")

GENERATED_DOCS_DIR = Path(__file__).resolve().parent.parent / "data" / "generated_docs"
GENERATED_DOCS_DIR.mkdir(parents=True, exist_ok=True)
DOCS_META_FILE = GENERATED_DOCS_DIR / "metadata.json"

FONTS_DIR = Path(__file__).resolve().parent.parent / "data" / "fonts"
FONTS_DIR.mkdir(parents=True, exist_ok=True)
KHMER_FONT_PATH = FONTS_DIR / "NotoSansKhmer.ttf"

# Register Unicode Font for Khmer and English
FONT_NAME = "Helvetica"
if KHMER_FONT_PATH.exists():
    try:
        pdfmetrics.registerFont(TTFont("NotoSansKhmer", str(KHMER_FONT_PATH)))
        FONT_NAME = "NotoSansKhmer"
        logger.info("Registered NotoSansKhmer font for PDF generation.")
    except Exception as e:
        logger.error("Failed to register NotoSansKhmer font: %s", e)


class NumberedCanvas(canvas.Canvas):
    """Custom canvas that adds page numbers and Sastra AI footer branding."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count: int):
        self.saveState()
        self.setFont(FONT_NAME, 8)
        self.setFillColor(colors.HexColor("#78716C"))
        
        # Footer divider line
        self.setStrokeColor(colors.HexColor("#D6D3D1"))
        self.setLineWidth(0.5)
        self.line(54, 40, letter[0] - 54, 40)
        
        # Footer text
        footer_text = f"Sastra AI Sovereign Assistant  •  Page {self._pageNumber} of {page_count}"
        self.drawString(54, 26, footer_text)
        
        date_str = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime())
        self.drawRightString(letter[0] - 54, 26, date_str)
        self.restoreState()


class DocumentGenerator:
    """Orchestrates generation and saving of user-requested documents."""

    def __init__(self):
        self._meta: Dict[str, dict] = {}
        self._load_meta()

    def _load_meta(self):
        if DOCS_META_FILE.exists():
            try:
                with open(DOCS_META_FILE, "r", encoding="utf-8") as f:
                    self._meta = json.load(f)
            except Exception as e:
                logger.error("Failed to load doc metadata: %s", e)

    def _save_meta(self):
        try:
            with open(DOCS_META_FILE, "w", encoding="utf-8") as f:
                json.dump(self._meta, f, indent=2)
        except Exception as e:
            logger.error("Failed to save doc metadata: %s", e)

    @staticmethod
    def _format_markdown_for_reportlab(text: str) -> str:
        """Converts raw markdown formatting (**bold**, *italic*, `code`) into ReportLab XML."""
        escaped = (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )
        escaped = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)
        escaped = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"<i>\1</i>", escaped)
        escaped = re.sub(r"`(.+?)`", r'<font face="Courier" color="#8C6514">\1</font>', escaped)
        return escaped

    def generate_pdf(
        self,
        title: str,
        content: str,
        author: str = "Sastra AI Assistant",
        subtitle: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generates a professional multi-page PDF document with Sastra styling & Khmer Unicode support."""
        doc_id = f"doc_{uuid.uuid4().hex[:10]}"
        filename = f"{self._sanitize_filename(title)}.pdf"
        file_path = GENERATED_DOCS_DIR / f"{doc_id}.pdf"

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54,
        )

        styles = getSampleStyleSheet()

        gold_color = colors.HexColor("#996B00")
        dark_color = colors.HexColor("#1C1917")

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontName=FONT_NAME,
            fontSize=18,
            leading=24,
            textColor=dark_color,
            spaceAfter=4,
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName=FONT_NAME,
            fontSize=9.5,
            leading=14,
            textColor=gold_color,
            spaceAfter=10,
        )
        h1_style = ParagraphStyle(
            "DocH1",
            parent=styles["Heading1"],
            fontName=FONT_NAME,
            fontSize=14,
            leading=19,
            textColor=gold_color,
            spaceBefore=14,
            spaceAfter=6,
        )
        h2_style = ParagraphStyle(
            "DocH2",
            parent=styles["Heading2"],
            fontName=FONT_NAME,
            fontSize=12,
            leading=16,
            textColor=dark_color,
            spaceBefore=10,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontName=FONT_NAME,
            fontSize=9.5,
            leading=15,
            textColor=dark_color,
            spaceAfter=6,
        )
        bullet_style = ParagraphStyle(
            "DocBullet",
            parent=styles["Normal"],
            fontName=FONT_NAME,
            fontSize=9.5,
            leading=14,
            textColor=dark_color,
            leftIndent=14,
            spaceAfter=3,
        )
        cell_style = ParagraphStyle(
            "DocCell",
            parent=styles["Normal"],
            fontName=FONT_NAME,
            fontSize=8.5,
            leading=12,
            textColor=dark_color,
        )
        cell_header_style = ParagraphStyle(
            "DocCellHeader",
            parent=styles["Normal"],
            fontName=FONT_NAME,
            fontSize=8.5,
            leading=12,
            textColor=colors.white,
        )

        story = []

        # Title and Header
        story.append(Paragraph(self._format_markdown_for_reportlab(title), title_style))
        if subtitle:
            story.append(Paragraph(self._format_markdown_for_reportlab(subtitle), subtitle_style))
        else:
            story.append(Paragraph(f"Authored by {author}  •  {time.strftime('%B %d, %Y')}", subtitle_style))

        story.append(HRFlowable(width="100%", thickness=1.5, color=gold_color, spaceBefore=2, spaceAfter=12))

        # Parse markdown-like content into flowables (including tables)
        lines = content.strip().split("\n")
        table_buffer: List[str] = []

        def flush_table():
            if not table_buffer:
                return
            table_data = []
            for row_idx, t_line in enumerate(table_buffer):
                if re.match(r"^\|?\s*[-:]+\s*\|", t_line):
                    continue  # Separator line
                cells = [c.strip() for c in t_line.split("|")[1:-1]]
                if not cells:
                    continue
                row_flowables = []
                for cell_text in cells:
                    cell_xml = self._format_markdown_for_reportlab(cell_text)
                    style_to_use = cell_header_style if row_idx == 0 else cell_style
                    row_flowables.append(Paragraph(cell_xml, style_to_use))
                table_data.append(row_flowables)

            if table_data:
                col_count = len(table_data[0])
                avail_width = letter[0] - 108  # 504 pt
                col_width = avail_width / max(col_count, 1)
                t = Table(table_data, colWidths=[col_width] * col_count)
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#996B00")),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9F8F6")]),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E7E5E4")),
                ]))
                story.append(Spacer(1, 4))
                story.append(t)
                story.append(Spacer(1, 8))
            table_buffer.clear()

        for line in lines:
            line_str = line.strip()
            # If line is part of a markdown table
            if line_str.startswith("|") and line_str.endswith("|"):
                table_buffer.append(line_str)
                continue
            else:
                flush_table()

            if not line_str:
                story.append(Spacer(1, 4))
            elif line_str.startswith("### "):
                clean_heading = self._format_markdown_for_reportlab(line_str[4:])
                story.append(Paragraph(clean_heading, h2_style))
            elif line_str.startswith("## "):
                clean_heading = self._format_markdown_for_reportlab(line_str[3:])
                story.append(Paragraph(clean_heading, h1_style))
            elif line_str.startswith("# "):
                clean_heading = self._format_markdown_for_reportlab(line_str[2:])
                story.append(Paragraph(clean_heading, title_style))
            elif line_str.startswith("- ") or line_str.startswith("* ") or line_str.startswith("• "):
                bullet_raw = line_str[2:].strip()
                bullet_xml = f"• {self._format_markdown_for_reportlab(bullet_raw)}"
                story.append(Paragraph(bullet_xml, bullet_style))
            else:
                formatted_xml = self._format_markdown_for_reportlab(line_str)
                story.append(Paragraph(formatted_xml, body_style))

        flush_table()

        doc.build(story, canvasmaker=NumberedCanvas)
        pdf_bytes = buffer.getvalue()
        buffer.close()

        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

        file_size = len(pdf_bytes)
        meta = {
            "id": doc_id,
            "title": title,
            "format": "pdf",
            "filename": filename,
            "size_bytes": file_size,
            "size_formatted": self._format_bytes(file_size),
            "created_at": time.time(),
            "download_url": f"/api/documents/generated/{doc_id}",
        }
        self._meta[doc_id] = meta
        self._save_meta()
        return meta

    def generate_docx(
        self,
        title: str,
        content: str,
        author: str = "Sastra AI Assistant",
    ) -> Dict[str, Any]:
        """Generates a styled Microsoft Word (.docx) document with Khmer font styling & table support."""
        doc_id = f"doc_{uuid.uuid4().hex[:10]}"
        filename = f"{self._sanitize_filename(title)}.docx"
        file_path = GENERATED_DOCS_DIR / f"{doc_id}.docx"

        doc = docx.Document()

        for section in doc.sections:
            section.top_margin = Inches(1)
            section.bottom_margin = Inches(1)
            section.left_margin = Inches(1)
            section.right_margin = Inches(1)

        # Title
        p_title = doc.add_paragraph()
        run_title = p_title.add_run(title)
        run_title.font.name = "Noto Sans Khmer"
        run_title.font.size = Pt(20)
        run_title.font.bold = True
        run_title.font.color.rgb = RGBColor(28, 25, 23)

        # Subtitle
        p_sub = doc.add_paragraph()
        run_sub = p_sub.add_run(f"Authored by {author} • {time.strftime('%B %d, %Y')}")
        run_sub.font.name = "Noto Sans Khmer"
        run_sub.font.size = Pt(9.5)
        run_sub.font.italic = True
        run_sub.font.color.rgb = RGBColor(180, 130, 20)

        doc.add_paragraph()

        lines = content.strip().split("\n")
        table_buffer: List[str] = []

        def flush_docx_table():
            if not table_buffer:
                return
            rows_data = []
            for t_line in table_buffer:
                if re.match(r"^\|?\s*[-:]+\s*\|", t_line):
                    continue
                cells = [c.strip() for c in t_line.split("|")[1:-1]]
                if cells:
                    rows_data.append(cells)

            if rows_data:
                col_count = len(rows_data[0])
                table = doc.add_table(rows=len(rows_data), cols=col_count)
                table.autofit = True
                for r_idx, row in enumerate(rows_data):
                    for c_idx, val in enumerate(row):
                        cell = table.cell(r_idx, c_idx)
                        cell.text = self._strip_markdown(val)
                        # Header row styling
                        if r_idx == 0:
                            shading_elm = parse_xml(r'<w:shd {} w:fill="996B00"/>'.format(nsdecls('w')))
                            cell._tc.get_or_add_tcPr().append(shading_elm)
                            for paragraph in cell.paragraphs:
                                for run in paragraph.runs:
                                    run.font.bold = True
                                    run.font.color.rgb = RGBColor(255, 255, 255)
                                    run.font.name = "Noto Sans Khmer"
                        else:
                            for paragraph in cell.paragraphs:
                                for run in paragraph.runs:
                                    run.font.name = "Noto Sans Khmer"
                doc.add_paragraph()
            table_buffer.clear()

        for line in lines:
            line_str = line.strip()
            if line_str.startswith("|") and line_str.endswith("|"):
                table_buffer.append(line_str)
                continue
            else:
                flush_docx_table()

            if not line_str:
                doc.add_paragraph()
            elif line_str.startswith("### "):
                p = doc.add_heading(level=3)
                r = p.add_run(self._strip_markdown(line_str[4:]))
                r.font.name = "Noto Sans Khmer"
            elif line_str.startswith("## "):
                p = doc.add_heading(level=2)
                r = p.add_run(self._strip_markdown(line_str[3:]))
                r.font.name = "Noto Sans Khmer"
            elif line_str.startswith("# "):
                p = doc.add_heading(level=1)
                r = p.add_run(self._strip_markdown(line_str[2:]))
                r.font.name = "Noto Sans Khmer"
            elif line_str.startswith("- ") or line_str.startswith("* "):
                p = doc.add_paragraph(style="List Bullet")
                self._add_formatted_runs_docx(p, line_str[2:])
            else:
                p = doc.add_paragraph()
                self._add_formatted_runs_docx(p, line_str)

        flush_docx_table()

        doc.save(str(file_path))
        file_size = file_path.stat().st_size

        meta = {
            "id": doc_id,
            "title": title,
            "format": "docx",
            "filename": filename,
            "size_bytes": file_size,
            "size_formatted": self._format_bytes(file_size),
            "created_at": time.time(),
            "download_url": f"/api/documents/generated/{doc_id}",
        }
        self._meta[doc_id] = meta
        self._save_meta()
        return meta

    @staticmethod
    def _strip_markdown(text: str) -> str:
        return re.sub(r"[*_`#]", "", text).strip()

    @staticmethod
    def _add_formatted_runs_docx(paragraph, text: str):
        """Parse **bold** markdown into docx runs with Khmer font applied."""
        parts = re.split(r"(\*\*.*?\*\*)", text)
        for part in parts:
            if part.startswith("**") and part.endswith("**"):
                run = paragraph.add_run(part[2:-2])
                run.bold = True
            else:
                run = paragraph.add_run(part)
            run.font.name = "Noto Sans Khmer"

    def generate_markdown(self, title: str, content: str) -> Dict[str, Any]:
        """Generates a Markdown file with YAML frontmatter."""
        doc_id = f"doc_{uuid.uuid4().hex[:10]}"
        filename = f"{self._sanitize_filename(title)}.md"
        file_path = GENERATED_DOCS_DIR / f"{doc_id}.md"

        full_md = f"""---
title: "{title}"
author: "Sastra AI"
date: "{time.strftime('%Y-%m-%d %H:%M:%S UTC')}"
generator: "Sastra AI Sovereign Assistant"
---

# {title}

{content.strip()}
"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(full_md)

        file_size = file_path.stat().st_size
        meta = {
            "id": doc_id,
            "title": title,
            "format": "md",
            "filename": filename,
            "size_bytes": file_size,
            "size_formatted": self._format_bytes(file_size),
            "created_at": time.time(),
            "download_url": f"/api/documents/generated/{doc_id}",
        }
        self._meta[doc_id] = meta
        self._save_meta()
        return meta

    def generate_csv(self, title: str, content: str) -> Dict[str, Any]:
        """Generates a structured CSV file."""
        doc_id = f"doc_{uuid.uuid4().hex[:10]}"
        filename = f"{self._sanitize_filename(title)}.csv"
        file_path = GENERATED_DOCS_DIR / f"{doc_id}.csv"

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content.strip())

        file_size = file_path.stat().st_size
        meta = {
            "id": doc_id,
            "title": title,
            "format": "csv",
            "filename": filename,
            "size_bytes": file_size,
            "size_formatted": self._format_bytes(file_size),
            "created_at": time.time(),
            "download_url": f"/api/documents/generated/{doc_id}",
        }
        self._meta[doc_id] = meta
        self._save_meta()
        return meta

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        return self._meta.get(doc_id)

    def get_document_path(self, doc_id: str) -> Optional[Path]:
        meta = self._meta.get(doc_id)
        if not meta:
            return None
        fmt = meta.get("format", "pdf")
        path = GENERATED_DOCS_DIR / f"{doc_id}.{fmt}"
        return path if path.exists() else None

    @staticmethod
    def _sanitize_filename(name: str) -> str:
        s = "".join(c for c in name if c.isalnum() or c in (" ", "_", "-")).rstrip()
        return s.replace(" ", "_")[:50] or "document"

    @staticmethod
    def _format_bytes(size: int) -> str:
        if size < 1024:
            return f"{size} B"
        if size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        return f"{size / (1024 * 1024):.1f} MB"


doc_generator = DocumentGenerator()
