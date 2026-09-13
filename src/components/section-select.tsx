import { isValidSection, VALID_SECTIONS } from "@/lib/ui-options";

export function SectionSelect({ name = "sectionName", value = "", filter = false, className = "" }: { name?: string; value?: string; filter?: boolean; className?: string }) {
  return <select aria-label="Section" name={name} defaultValue={isValidSection(value) ? value : ""} required={!filter} className={className}>
    <option value="" disabled={!filter}>{filter ? "All Sections" : "Choose section"}</option>
    {VALID_SECTIONS.map(section => <option key={section} value={section}>{section}</option>)}
  </select>;
}
