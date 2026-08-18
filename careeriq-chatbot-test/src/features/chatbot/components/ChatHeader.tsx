"use client";

import { Bot, X } from "lucide-react";

interface ChatHeaderProps {
  title: string;
  onClose?: () => void;
}

export function ChatHeader({ title, onClose }: ChatHeaderProps) {
  return (
    <div className="relative z-10 flex items-center justify-between border-b border-accent/[0.18] bg-white/[0.02] px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-accent/35 bg-accent/[0.12] text-accent">
          <Bot size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide text-white">{title}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-glow" />
            Online
          </div>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-white"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}

export default ChatHeader;
