import { useDispatch, useSelector } from "react-redux";
import { Pin, PinOff } from "lucide-react";
import { togglePin } from "./pinSlice";
import { cn } from "../../lib/utils";
import type { Message } from "../../types/chat";
import type { RootState } from "../../store";

interface PinButtonProps {
  message: Message;
}

export default function PinButton({ message }: PinButtonProps) {
  const dispatch = useDispatch();
  const pinned = useSelector((s: RootState) =>
    s.pin.pinned.some((m) => m.timestamp === message.timestamp),
  );

  return (
    <button
      type="button"
      onClick={() => dispatch(togglePin(message))}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs transition-colors",
        "hover:bg-secondary hover:text-foreground",
        pinned && "text-primary",
      )}
      aria-label={pinned ? "Unpin message" : "Pin message"}
      title={pinned ? "Unpin" : "Pin"}
    >
      {pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
      <span>{pinned ? "Pinned" : "Pin"}</span>
    </button>
  );
}
