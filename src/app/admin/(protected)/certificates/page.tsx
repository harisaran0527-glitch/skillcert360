import { db } from "@/lib/db";
export default async function AdminCertificatesPage() {
 const certificates = await db.certificate.findMany({ include: { student: true, skill: true, verifiedBy: { select: { email: true } }, reviews: { include: { actor: { select: { email: true } } }, orderBy: { createdAt: "desc" } } }, orderBy: { submittedAt: "desc" } });
 return <main className="space-y-6"><h1 className="text-4xl font-bold">Certificate verification</h1><p>File upload: configuration required. Credential URL and ID verification are available.</p>
 {certificates.map(c => <article key={c.id} className="space-y-3 rounded-xl border bg-white p-6">
  <h2 className="text-2xl font-bold">{c.student.fullName} · {c.skill.name}</h2><p>{c.student.registerNumber} · {c.status}</p>
  <p>Credential ID: {c.credentialId ?? "Not provided"}</p>
  {c.officialUrl && <a className="text-blue-700 underline" href={c.officialUrl} target="_blank" rel="noreferrer">Open credential URL</a>}
  <p>Issued: {c.issuedAt?.toLocaleDateString() ?? "Not provided"} · Submitted: {c.submittedAt?.toLocaleString() ?? "Not submitted"}</p>
  <p>Verified: {c.verifiedAt?.toLocaleString() ?? "Pending"} · Verified by: {c.verifiedBy?.email ?? "Pending"}</p>
  {c.remarks && <p>Admin remarks: {c.remarks}</p>}
  {c.status === "PENDING_VERIFICATION" && <form action="/api/admin/certificates" method="post" className="space-y-3">
   <input type="hidden" name="certificateId" value={c.id} />
   <label className="block">Admin remarks<textarea name="remarks" maxLength={2000} className="mt-2 block w-full rounded-lg border p-3" /></label>
   <div className="flex flex-wrap gap-3"><button name="status" value="VERIFIED" className="rounded-lg bg-emerald-700 p-3 text-white">Approve</button><button name="status" value="REJECTED" className="rounded-lg bg-red-700 p-3 text-white">Reject</button><button name="status" value="NEEDS_RESUBMISSION" className="rounded-lg bg-amber-100 p-3">Request Resubmission</button></div>
  </form>}
  <details><summary>Verification history ({c.reviews.length})</summary>{c.reviews.map(r => <p key={r.id} className="my-2">{r.createdAt.toLocaleString()} · {r.status} · {r.actor.email} · {r.remarks} · {r.credentialId} · {r.officialUrl}</p>)}</details>
 </article>)}
 </main>;
}
