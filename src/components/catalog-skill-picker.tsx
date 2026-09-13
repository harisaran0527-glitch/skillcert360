"use client";
import { useEffect, useState } from "react";
type Option = { id: string; name: string; level: { name: string } };
export function CatalogueSkillPicker({ initial }: { initial?: Option | null }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initial?.id ?? "");
  const [options, setOptions] = useState<Option[]>(initial ? [initial] : []);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/admin/skills?q=" + encodeURIComponent(query), { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to search skills");
        const data: { skills: Option[] } = await response.json();
        setOptions(current => [...current.filter(item => item.id === selected && !data.skills.some(next => next.id === selected)), ...data.skills]);
        setError("");
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to search skills"); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, selected]);
  const style = "w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-white";
  return <div className="space-y-2"><input type="search" aria-label="Find target skill" placeholder="Search skills to choose a mapping" className={style} value={query} onChange={event => setQuery(event.target.value)} /><select required aria-label="Target Skill" name="skillId" className={style} value={selected} onChange={event => setSelected(event.target.value)}><option value="">Choose a skill</option>{options.map(option => <option key={option.id} value={option.id}>{option.name} · {option.level.name}</option>)}</select>{error && <p role="alert">{error}</p>}</div>;
}
