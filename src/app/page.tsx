export default function Home() {
  return (
    <main className="min-h-screen bg-[#0c2140] px-6 py-8 text-white sm:px-12">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <div><p className="font-display text-xl font-bold tracking-tight">SkillCert <span className="text-[#35c3d9]">360</span></p><p className="mt-1 text-xs text-blue-100/70">Official learning. Verified progress.</p></div>
        <a href="/skills" className="text-sm text-blue-100 transition hover:text-white">Explore skills</a>
      </nav>
      <section className="mx-auto grid max-w-6xl gap-16 py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-36">
        <div><p className="mb-5 text-sm font-semibold uppercase tracking-[.22em] text-[#35c3d9]">A clearer path to proof</p><h1 className="max-w-3xl font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">Build skills.<br /><span className="text-[#8edfeb]">Prove them officially.</span></h1><p className="mt-8 max-w-xl text-lg leading-8 text-blue-100/75">Learn from recognized providers, complete a secure internal assessment, and submit the official certificate you earned for verification.</p><div className="mt-10 flex flex-col gap-3 sm:flex-row"><a href="/student/login" className="rounded-xl bg-[#35c3d9] px-6 py-3.5 text-center font-bold text-[#0c2140] transition hover:bg-white">Student portal</a><a href="/admin/login" className="rounded-xl border border-white/20 px-6 py-3.5 text-center font-semibold transition hover:border-white/60">Admin portal</a></div></div>
        <div className="border-l border-white/15 pl-8 lg:pl-14"><p className="text-sm font-semibold text-[#8edfeb]">The trust loop</p><div className="mt-7 space-y-7">{[["01", "Learn officially", "Start with a real provider course."], ["02", "Pass internally", "Show your understanding in a protected assessment."], ["03", "Verify externally", "Submit the certificate you actually earned."]].map(([number, title, copy]) => <div key={number} className="flex gap-5"><span className="font-display text-sm text-[#35c3d9]">{number}</span><div><h2 className="font-display text-lg font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-blue-100/60">{copy}</p></div></div>)}</div></div>
      </section>
    </main>
  );
}
