"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRecruiterSkillCatalog } from "@/lib/api/recruiter-skills";

function normalizeKey(name: string) {
  return name.trim().toLowerCase();
}

export function SkillPickerInput({
  label,
  hint,
  placeholder,
  values,
  onChange,
  requiredCount,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  requiredCount?: number;
}) {
  const [draft, setDraft] = useState("");
  const [catalog, setCatalog] = useState<{ skill_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const skills = await getRecruiterSkillCatalog();
        if (!cancelled) setCatalog(skills);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    const needle = draft.trim().toLowerCase();
    const selected = new Set(values.map(normalizeKey));
    return catalog
      .map((s) => s.skill_name)
      .filter((name) => !selected.has(normalizeKey(name)))
      .filter((name) => !needle || name.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [catalog, draft, values]);

  const resolveCanonical = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      const key = normalizeKey(trimmed);
      const hit = catalog.find((s) => normalizeKey(s.skill_name) === key);
      return hit?.skill_name ?? trimmed;
    },
    [catalog]
  );

  function add(raw?: string) {
    const canonical = resolveCanonical(raw ?? draft);
    if (!canonical) return;
    if (values.some((v) => normalizeKey(v) === normalizeKey(canonical))) return;
    onChange([...values, canonical]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-sm font-medium text-[var(--color-text-muted)]">{label}</label>
        {hint && <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">{hint}</p>}
        {requiredCount != null && values.length < requiredCount && (
          <p className="mt-0.5 text-xs text-[var(--color-danger)]">
            Add at least {requiredCount} required skill{requiredCount === 1 ? "" : "s"}.
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={loading ? "Loading skill catalog…" : placeholder}
          className="flex-1"
          list={`${label.replace(/\s+/g, "-")}-skills`}
        />
        <datalist id={`${label.replace(/\s+/g, "-")}-skills`}>
          {suggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <Button type="button" variant="secondary" size="md" onClick={() => add()}>
          <Plus size={15} />
        </Button>
      </div>
      {suggestions.length > 0 && draft.trim() && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-bg-elevated)]"
              onClick={() => add(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <Badge key={v} tone="accent" className="gap-1.5">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="hover:text-[var(--color-text)]"
              >
                <X size={11} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
