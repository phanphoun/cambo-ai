"""Tool registry routes — list available function-calling tools."""
import logging

from fastapi import APIRouter
from models.schemas import ToolList
from services import tools as tool_registry

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.get("", response_model=ToolList)
async def list_tools():
    return {"tools": tool_registry.list_tools()}
