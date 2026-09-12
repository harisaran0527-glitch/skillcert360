import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export default async function StudentCertificatesPage() {
  const session = await getSession();
  if (!session || session.role !== "STUDENT") redirect("/student/login");

  const profile = await db.studentProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) redirect("/student/login");

  const certificates = await db.certificate.findMany({
    where: { studentId: profile.id },
    include: { skill: true, verifiedBy: { select: { email: true } }, reviews: { include: { actor: { select: { email: true } } }, orderBy: { createdAt: "desc" } } },
    orderBy: { submittedAt: "desc" },
  });

  const eligible = certificates.filter(c => ["UNLOCKED", "REJECTED", "NEEDS_RESUBMISSION", "PENDING_SUBMISSION"].includes(c.status));

  return (
    <main className="min-h-screen bg-[#f5f8fc] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#1e6fd9]">Certificates</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-[#10233f]">Submit official credential</h1>
          </div>
          <Link href="/student/dashboard" className="text-sm font-semibold text-[#1e6fd9]">← Dashboard</Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-2xl font-bold text-[#10233f]">Certificate form</h2>
            <p className="mt-2 text-sm text-slate-500">File upload is disabled unless external storage is configured. Use the real official certificate URL and credential ID.</p>
            <form action="/api/student/certificates" method="post" className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Skill
                <select name="skillId" className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  {eligible.map((certificate) => <option key={certificate.id} value={certificate.skillId}>{certificate.skill.name}</option>)}
                  {!eligible.length && <option value="">No available skills</option>}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">Official certificate URL
                <input name="officialUrl" type="url" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" placeholder="https://example.com/certificate" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Credential ID
                <input name="credentialId" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" placeholder="ABC-12345" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Issue date
                <input name="issuedAt" type="date" required className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5" />
              </label>
              <button disabled={!eligible.length} className="w-full rounded-lg bg-[#1e6fd9] px-4 py-3 font-bold text-white">Submit certificate</button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-display text-2xl font-bold text-[#10233f]">Submission history</h2>
            <div className="mt-5 space-y-3">
              {certificates.length === 0 ? <p className="text-sm text-slate-500">No certificate submissions yet.</p> : certificates.map((certificate) => (
                <div key={certificate.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-[#10233f]">{certificate.skill.name}</h3>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">{certificate.status}</span>
                  </div>
                  {certificate.officialUrl && <a href={certificate.officialUrl} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-[#1e6fd9]">Open official certificate</a>}
                  {certificate.remarks && <p>Admin remarks: {certificate.remarks}</p>}<p>Issued: {certificate.issuedAt?.toLocaleDateString() ?? "Not provided"} · Verified: {certificate.verifiedAt?.toLocaleString() ?? "Pending"} · Verified by: {certificate.verifiedBy?.email ?? "Pending"}</p>{certificate.reviews.map(review => <p key={review.id} className="mt-2 text-sm">{review.createdAt.toLocaleString()} · {review.status} · {review.actor.email} · {review.remarks}</p>)}{certificate.credentialId && <p className="mt-2 text-sm text-slate-600">Credential ID: {certificate.credentialId}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
