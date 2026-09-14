import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { canDownloadCertificate } from "@/lib/certificate-eligibility";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.mustChangePassword) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const certificate = await db.certificate.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          userId: true,
          fullName: true,
          registerNumber: true,
          department: { select: { name: true } },
        },
      },
      skill: { select: { name: true, level: { select: { name: true } } } },
      course: { select: { title: true, name: true } },
      provider: { select: { name: true } },
    },
  });

  if (!certificate) {
    return new Response("Certificate not found", { status: 404 });
  }

  // ── Authorization ─────────────────────────────────────────────────────────
  const isOwner =
    session.role === "STUDENT" &&
    certificate.student.userId === session.userId;
  const isAdmin = session.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return new Response("Forbidden: Access denied.", { status: 403 });
  }

  // Must be UNLOCKED or VERIFIED to generate a certificate view
  if (!await canDownloadCertificate(certificate)) {
    return new Response("Certificate not yet available for download.", {
      status: 403,
    });
  }

  // ── Belt-and-suspenders: re-verify assessment PASS directly ───────────────
  // This guard is independent of certificate.status so that even if the status
  // field were ever stale or tampered, the download is still denied unless the
  // actual assessment record records a non-terminated PASS for this student+skill.
  const validPassAttempt = await db.assessmentAttempt.findFirst({
    where: {
      studentId: certificate.studentId,
      skillId: certificate.skillId,
      passed: true,
      terminated: false,
      NOT: { submittedAt: null },
    },
  });
  if (!validPassAttempt) {
    return new Response("Forbidden: Assessment not passed.", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const asDownload = searchParams.get("format") === "download";

  const studentName = certificate.student.fullName;
  const registerNumber = certificate.student.registerNumber;
  const department = certificate.student.department?.name ?? "";
  const skillName = certificate.skill.name;
  const levelName = certificate.skill.level.name;
  const courseName =
    certificate.course?.title ?? certificate.course?.name ?? "Official Course";
  const providerName = certificate.provider?.name ?? "Accredited Provider";
  const issuedDate = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
  const certId = certificate.id;
  const credentialId = certificate.credentialId ?? certId;
  const isVerified = certificate.status === "VERIFIED";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate — ${escapeHtml(skillName)} — SkillCert 360</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; min-height: 100%; background: #0f1117; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Inter', sans-serif; }

    .cert-wrap {
      width: 100%;
      max-width: 860px;
      background: linear-gradient(135deg, #1a1f2e 0%, #0d1117 50%, #1a1f2e 100%);
      border: 1.5px solid rgba(99, 102, 241, 0.45);
      border-radius: 24px;
      padding: 56px 64px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 80px rgba(99, 102, 241, 0.15), 0 24px 64px rgba(0,0,0,0.6);
    }

    /* Ornamental corner borders */
    .cert-wrap::before,
    .cert-wrap::after {
      content: '';
      position: absolute;
      border: 2px solid rgba(99,102,241,0.3);
      border-radius: 16px;
      pointer-events: none;
    }
    .cert-wrap::before { top: 12px; left: 12px; right: 12px; bottom: 12px; }
    .cert-wrap::after { top: 20px; left: 20px; right: 20px; bottom: 20px; opacity: 0.4; }

    /* Radial glow */
    .glow {
      position: absolute;
      top: -120px; left: 50%; transform: translateX(-50%);
      width: 600px; height: 400px;
      background: radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%);
      pointer-events: none;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 40px;
      position: relative;
      z-index: 1;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
    }
    .brand-text h2 {
      font-size: 15px;
      font-weight: 700;
      color: #e2e8f0;
      letter-spacing: 0.02em;
    }
    .brand-text p {
      font-size: 10px;
      color: #6366f1;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .seal {
      width: 72px; height: 72px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, #6366f1, #8b5cf6, #06b6d4, #6366f1);
      display: flex; align-items: center; justify-content: center;
      padding: 3px;
      box-shadow: 0 0 24px rgba(99,102,241,0.5);
    }
    .seal-inner {
      width: 100%; height: 100%;
      border-radius: 50%;
      background: #0d1117;
      display: flex; align-items: center; justify-content: center;
      flex-direction: column;
    }
    .seal-inner span { font-size: 9px; font-weight: 700; color: #6366f1; letter-spacing: 0.06em; text-transform: uppercase; text-align: center; line-height: 1.2; }

    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(99,102,241,0.6), rgba(6,182,212,0.4), transparent);
      margin: 20px 0 32px;
      position: relative; z-index: 1;
    }

    .cert-body { position: relative; z-index: 1; text-align: center; }

    .presented-to {
      font-size: 11px;
      font-weight: 600;
      color: #6366f1;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .student-name {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      font-weight: 700;
      color: #f8fafc;
      line-height: 1.1;
      background: linear-gradient(135deg, #e2e8f0, #f8fafc, #c7d2fe);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }

    .reg-num {
      font-size: 12px;
      font-family: 'Inter', monospace;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.06em;
      margin-bottom: 6px;
    }

    .dept {
      font-size: 11px;
      color: #475569;
      margin-bottom: 24px;
    }

    .has-completed {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 400;
      margin-bottom: 12px;
    }

    .skill-name {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 600;
      font-style: italic;
      color: #a5b4fc;
      margin-bottom: 10px;
    }

    .level-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(99,102,241,0.15);
      border: 1px solid rgba(99,102,241,0.4);
      border-radius: 999px;
      padding: 4px 14px;
      font-size: 10px;
      font-weight: 700;
      color: #a5b4fc;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .course-info {
      background: rgba(99,102,241,0.08);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 12px;
      padding: 14px 24px;
      margin: 0 auto 28px;
      max-width: 540px;
      text-align: center;
    }
    .course-info p { font-size: 11px; color: #94a3b8; margin-bottom: 3px; }
    .course-info .course-title { font-size: 13px; font-weight: 600; color: #e2e8f0; }
    .course-info .provider-name { font-size: 11px; font-weight: 600; color: #06b6d4; margin-top: 2px; }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      padding: 6px 18px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 28px;
    }
    .status-verified {
      background: rgba(16,185,129,0.15);
      border: 1px solid rgba(16,185,129,0.5);
      color: #34d399;
    }
    .status-unlocked {
      background: rgba(99,102,241,0.15);
      border: 1px solid rgba(99,102,241,0.5);
      color: #a5b4fc;
    }

    .footer {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 16px;
      align-items: end;
      padding-top: 24px;
      border-top: 1px solid rgba(99,102,241,0.2);
      position: relative; z-index: 1;
    }
    .footer-left, .footer-right { font-size: 10px; color: #475569; }
    .footer-left .label, .footer-right .label { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; color: #334155; }
    .footer-left .val, .footer-right .val { font-weight: 600; color: #64748b; font-family: monospace; font-size: 10px; word-break: break-all; }
    .footer-center { text-align: center; }
    .footer-center .sc360 { font-size: 11px; font-weight: 700; color: #6366f1; }
    .footer-center .watermark { font-size: 9px; color: #334155; margin-top: 2px; letter-spacing: 0.06em; text-transform: uppercase; }

    .print-btn {
      display: block;
      margin: 32px auto 0;
      padding: 10px 28px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 4px 15px rgba(99,102,241,0.4);
    }
    .print-btn:hover { opacity: 0.88; }

    @media print {
      html, body { background: white; padding: 0; }
      .cert-wrap { border-color: #6366f1; box-shadow: none; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div>
    <div class="cert-wrap">
      <div class="glow"></div>

      <!-- Header -->
      <div class="header">
        <div class="brand">
          <div class="brand-icon">🎓</div>
          <div class="brand-text">
            <h2>SkillCert 360</h2>
            <p>Official Certificate</p>
          </div>
        </div>
        <div class="seal">
          <div class="seal-inner">
            <span>SKILL<br>CERT<br>360</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Body -->
      <div class="cert-body">
        <p class="presented-to">This certifies that</p>
        <h1 class="student-name">${escapeHtml(studentName)}</h1>
        <p class="reg-num">Register No: ${escapeHtml(registerNumber)}</p>
        ${department ? `<p class="dept">${escapeHtml(department)}</p>` : ""}

        <p class="has-completed">has successfully completed the skill assessment for</p>

        <p class="skill-name">${escapeHtml(skillName)}</p>

        <div>
          <span class="level-badge">⭐ ${escapeHtml(levelName)} Level</span>
        </div>

        <div class="course-info">
          <p>via official course</p>
          <p class="course-title">${escapeHtml(courseName)}</p>
          <p class="provider-name">by ${escapeHtml(providerName)}</p>
        </div>

        <div>
          <span class="status-badge ${isVerified ? "status-verified" : "status-unlocked"}">
            ${isVerified ? "✓ Verified & Authenticated" : "✓ Assessment Passed — Unlocked"}
          </span>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-left">
          <span class="label">Issue Date</span>
          <span class="val">${escapeHtml(issuedDate)}</span>
        </div>
        <div class="footer-center">
          <div class="sc360">SkillCert 360</div>
          <div class="watermark">Credential Platform</div>
        </div>
        <div class="footer-right" style="text-align:right">
          <span class="label">Credential ID</span>
          <span class="val">${escapeHtml(credentialId)}</span>
        </div>
      </div>
    </div>

    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
</body>
</html>`;

  const disposition = asDownload
    ? `attachment; filename="SkillCert360-${encodeURIComponent(skillName)}-${encodeURIComponent(registerNumber)}.html"`
    : "inline";

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
