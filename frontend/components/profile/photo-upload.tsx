"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function PhotoUpload({
  photoUrl,
  onUpload,
  isUploading,
}: {
  photoUrl?: string;
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-muted)]",
          "transition-colors hover:border-[var(--color-accent)]"
        )}
      >
        {photoUrl ? (
          <Image src={photoUrl} alt="Passport photo" fill className="object-cover" unoptimized />
        ) : (
          <User size={40} className="text-[var(--color-text-faint)]" strokeWidth={1.5} />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {isUploading ? (
            <Loader2 size={20} className="animate-spin text-white" />
          ) : (
            <Camera size={20} className="text-white" />
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </button>
      <span className="text-xs text-[var(--color-text-faint)]">
        Passport-size photo · JPG or PNG
      </span>
    </div>
  );
}
