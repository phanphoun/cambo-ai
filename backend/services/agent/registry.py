"""In-process registry of agent runs.

Runs are held in memory so their patch queues stay addressable after the SSE
stream closes — the user approves diffs minutes after the agent stopped talking.
Old runs are evicted by count and age to bound memory.
"""
from __future__ import annotations

import logging
import time
from collections import OrderedDict
from typing import List, Optional

from services.agent.runner import AgentRun

logger = logging.getLogger("cambo.agent.registry")

MAX_RUNS = 40
MAX_AGE_SECONDS = 12 * 3600


class RunRegistry:
    def __init__(self):
        self._runs: "OrderedDict[str, AgentRun]" = OrderedDict()

    def add(self, run: AgentRun) -> AgentRun:
        self._runs[run.id] = run
        self._evict()
        return run

    def get(self, run_id: str) -> Optional[AgentRun]:
        return self._runs.get(run_id)

    def list(self, user_id: Optional[str] = None, limit: int = 20) -> List[AgentRun]:
        runs = list(self._runs.values())
        if user_id:
            runs = [r for r in runs if r.user_id == user_id]
        return sorted(runs, key=lambda r: r.created_at, reverse=True)[:limit]

    def _evict(self) -> None:
        now = time.time()
        stale = [
            rid for rid, run in self._runs.items()
            if now - run.created_at > MAX_AGE_SECONDS
            and not run.patches.pending()          # never drop unreviewed work
        ]
        for rid in stale:
            self._runs.pop(rid, None)

        while len(self._runs) > MAX_RUNS:
            rid, run = next(iter(self._runs.items()))
            if run.patches.pending() and len(self._runs) <= MAX_RUNS * 2:
                # Give unreviewed proposals a stay of execution.
                self._runs.move_to_end(rid)
                break
            self._runs.pop(rid, None)
            logger.debug("Evicted agent run %s", rid)


run_registry = RunRegistry()
