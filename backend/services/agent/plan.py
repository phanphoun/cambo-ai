"""The agent's task plan — a visible, mutable todo list.

Planning is a *tool*, not a preamble. The agent writes the plan before it starts
working and updates step status as it goes, which gives the UI something honest
to render and keeps a long run anchored to its original goal.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


class StepStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    DONE = "done"
    BLOCKED = "blocked"


@dataclass
class Step:
    index: int
    title: str
    status: StepStatus = StepStatus.PENDING
    note: str = ""

    def to_dict(self) -> dict:
        return {
            "index": self.index,
            "title": self.title,
            "status": self.status.value,
            "note": self.note,
        }


@dataclass
class Plan:
    goal: str = ""
    steps: List[Step] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

    def set_steps(self, titles: List[str]) -> "Plan":
        self.steps = [Step(index=i + 1, title=t.strip()) for i, t in enumerate(titles) if t.strip()]
        self.updated_at = time.time()
        return self

    def update_step(self, index: int, status: Optional[str] = None, note: str = "") -> Step:
        step = next((s for s in self.steps if s.index == index), None)
        if step is None:
            raise ValueError(
                f"No step {index}. Current plan has steps 1..{len(self.steps)}."
            )
        if status:
            try:
                step.status = StepStatus(status)
            except ValueError:
                raise ValueError(
                    f"Invalid status '{status}'. Use: pending, active, done, blocked."
                ) from None
        if note:
            step.note = note.strip()
        self.updated_at = time.time()
        return step

    @property
    def is_complete(self) -> bool:
        return bool(self.steps) and all(
            s.status in (StepStatus.DONE, StepStatus.BLOCKED) for s in self.steps
        )

    def render(self) -> str:
        """Compact text form, re-injected into the model each round."""
        if not self.steps:
            return "(no plan yet — call write_plan first)"
        marks = {
            StepStatus.PENDING: "[ ]",
            StepStatus.ACTIVE: "[~]",
            StepStatus.DONE: "[x]",
            StepStatus.BLOCKED: "[!]",
        }
        lines = [f"{marks[s.status]} {s.index}. {s.title}" + (f"  — {s.note}" if s.note else "")
                 for s in self.steps]
        return "\n".join(lines)

    def to_dict(self) -> dict:
        return {
            "goal": self.goal,
            "steps": [s.to_dict() for s in self.steps],
            "complete": self.is_complete,
            "updated_at": self.updated_at,
        }
