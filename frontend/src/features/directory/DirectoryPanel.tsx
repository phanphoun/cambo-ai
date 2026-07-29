import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Search, ExternalLink, MapPin, Tags, MessageCircle } from "lucide-react";
import { setDirectoryOpen, setDirectorySearch } from "./directorySlice";
import { companies, type Company } from "../../data/cambodia-tech-directory";
import type { RootState } from "../../store";

export default function DirectoryPanel() {
  const dispatch = useDispatch();
  const { open, search } = useSelector((s: RootState) => s.directory);

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q),
    );
  }, [search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => dispatch(setDirectoryOpen(false))} />
      <div className="relative z-10 flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => dispatch(setDirectorySearch(e.target.value))}
              placeholder="Search companies, categories, tags..."
              className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
              autoFocus
            />
            {search && (
              <button
                onClick={() => dispatch(setDirectorySearch(""))}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => dispatch(setDirectoryOpen(false))}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No companies found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
          {filtered.length} of {companies.length} companies
        </div>
      </div>
    </div>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const dispatch = useDispatch();

  function handleAsk() {
    const prompt = `Tell me about ${company.name} in Cambodia. ${company.description}`;
    dispatch(setDirectoryOpen(false));
    // Small delay to let modal close before sending
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cambo-ask", { detail: { prompt } }));
    }, 200);
  }

  return (
    <div className="group rounded-xl border border-border bg-background p-3.5 transition-all hover:border-primary/50 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {company.name}
          </h3>
          {company.khmerName && (
            <p className="truncate text-[11px] text-muted-foreground">{company.khmerName}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleAsk}
            className="rounded-lg p-1.5 text-primary/70 transition-all hover:bg-primary/10 hover:text-primary"
            title={`Ask about ${company.name}`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
              title={`Visit ${company.name} website`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
        {company.description}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <MapPin className="h-2.5 w-2.5" />
          {company.location}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {company.category}
        </span>
      </div>
      {company.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {company.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 rounded bg-border/50 px-1.5 py-0.5 text-[9px] text-muted-foreground"
            >
              <Tags className="h-2 w-2" />
              {tag}
            </span>
          ))}
        </div>
      )}
      {company.founded && (
        <p className="mt-1 text-[10px] text-muted-foreground/60">
          Founded {company.founded}
        </p>
      )}
    </div>
  );
}
