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
  const validPassAttempt = await db.assessmentAttempt.findFirst({
    where: {
      studentId: certificate.studentId,
      skillId: certificate.skillId,
      passed: true,
      terminated: false,
      NOT: { submittedAt: null },
    },
    orderBy: { submittedAt: "desc" },
  });

  if (!validPassAttempt) {
    return new Response("Forbidden: Assessment not passed.", { status: 403 });
  }

  // Fetch studentSkill for course completion date
  const studentSkill = await db.studentSkill.findUnique({
    where: {
      studentId_skillId: {
        studentId: certificate.studentId,
        skillId: certificate.skillId,
      },
    },
    select: { completedAt: true, startedAt: true },
  });

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

  const score = validPassAttempt.score ?? 0;
  const questionCount = validPassAttempt.questionCount ?? 50;
  const percentage = questionCount > 0 ? Math.round((score / questionCount) * 100) : 0;

  const rawCompletionDate = studentSkill?.completedAt ?? certificate.submittedAt ?? certificate.issuedAt ?? validPassAttempt.submittedAt;
  const completionDate = rawCompletionDate
    ? new Date(rawCompletionDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const rawIssuedDate = certificate.issuedAt ?? validPassAttempt.submittedAt ?? new Date();
  const issuedDate = new Date(rawIssuedDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const certId = certificate.id;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate of Achievement — ${escapeHtml(studentName)} — SkillCert 360</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; min-height: 100%; background: #0b0f19; display: flex; align-items: center; justify-content: center; padding: 32px 16px; font-family: 'Inter', sans-serif; color: #f8fafc; }

    .cert-outer {
      width: 100%;
      max-width: 900px;
      background: linear-gradient(135deg, #0f172a 0%, #090d16 50%, #1e1b4b 100%);
      border: 2px solid #6366f1;
      border-radius: 24px;
      padding: 48px 56px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 0 80px rgba(99, 102, 241, 0.25), 0 24px 64px rgba(0, 0, 0, 0.8);
    }

    .cert-border-inner {
      position: absolute;
      top: 14px; left: 14px; right: 14px; bottom: 14px;
      border: 1px solid rgba(165, 180, 252, 0.3);
      border-radius: 16px;
      pointer-events: none;
    }

    .cert-corner-tl, .cert-corner-tr, .cert-corner-bl, .cert-corner-br {
      position: absolute; width: 24px; height: 24px; border-color: #818cf8; border-style: solid; pointer-events: none;
    }
    .cert-corner-tl { top: 22px; left: 22px; border-width: 3px 0 0 3px; }
    .cert-corner-tr { top: 22px; right: 22px; border-width: 3px 3px 0 0; }
    .cert-corner-bl { bottom: 22px; left: 22px; border-width: 0 0 3px 3px; }
    .cert-corner-br { bottom: 22px; right: 22px; border-width: 0 3px 3px 0; }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      position: relative;
      z-index: 1;
    }

    .issuer-brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .issuer-logo {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #4f46e5, #9333ea);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
    }
    .issuer-title h2 {
      font-family: 'Cinzel', serif;
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.05em;
    }
    .issuer-title p {
      font-size: 11px;
      color: #818cf8;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .badge-seal {
      width: 76px; height: 76px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, #6366f1, #a855f7, #06b6d4, #6366f1);
      padding: 3px;
      box-shadow: 0 0 28px rgba(99, 102, 241, 0.5);
    }
    .badge-seal-inner {
      width: 100%; height: 100%;
      border-radius: 50%;
      background: #090d16;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center;
    }
    .badge-seal-inner span {
      font-size: 8px; font-weight: 800; color: #a5b4fc; letter-spacing: 0.08em; text-transform: uppercase; line-height: 1.2;
    }

    .cert-title-container {
      text-align: center;
      margin-bottom: 28px;
    }
    .cert-main-title {
      font-family: 'Cinzel', serif;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: #c7d2fe;
      text-transform: uppercase;
    }
    .cert-subtitle {
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .cert-body { text-align: center; position: relative; z-index: 1; }

    .recipient-intro {
      font-size: 11px; font-weight: 600; color: #818cf8; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px;
    }
    .student-name {
      font-family: 'Playfair Display', serif;
      font-size: 38px; font-weight: 700;
      color: #ffffff;
      background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #a5b4fc 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      margin-bottom: 4px;
    }
    .student-reg {
      font-size: 12px; font-family: monospace; color: #94a3b8; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 20px;
    }

    .achievement-text {
      font-size: 13px; color: #cbd5e1; margin-bottom: 12px; font-weight: 400;
    }
    .skill-title {
      font-family: 'Playfair Display', serif;
      font-size: 26px; font-weight: 700; font-style: italic; color: #a5b4fc; margin-bottom: 6px;
    }
    .course-details {
      display: inline-block;
      background: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 12px;
      padding: 12px 24px;
      margin-bottom: 24px;
      max-width: 600px;
    }
    .course-title { font-size: 14px; font-weight: 600; color: #f1f5f9; }
    .provider-tag { font-size: 11px; color: #38bdf8; font-weight: 600; margin-top: 3px; }

    .perf-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      max-width: 520px;
      margin: 0 auto 28px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(129, 140, 248, 0.3);
      border-radius: 16px;
      padding: 14px 20px;
    }
    .perf-item { text-align: center; }
    .perf-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.08em; display: block; margin-bottom: 4px; }
    .perf-value { font-size: 18px; font-weight: 800; font-family: monospace; color: #ffffff; }
    .perf-value.pass { color: #34d399; }
    .perf-value.cyan { color: #38bdf8; }

    .metadata-footer {
      display: grid;
      grid-template-columns: 1fr 1fr 1.2fr;
      gap: 16px;
      border-top: 1px solid rgba(99, 102, 241, 0.25);
      padding-top: 20px;
      text-align: left;
      font-size: 10px;
    }
    .meta-block .meta-lbl { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 3px; }
    .meta-block .meta-val { font-size: 11px; font-weight: 600; color: #e2e8f0; font-family: monospace; }
    .meta-block.right { text-align: right; }

    .print-bar {
      margin-top: 24px; text-align: center;
    }
    .print-btn {
      padding: 10px 28px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #ffffff; border: none; border-radius: 9999px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
      transition: all 0.2s;
    }
    .print-btn:hover { transform: translateY(-1px); opacity: 0.95; }

    @media print {
      body { background: white; padding: 0; }
      .cert-outer { box-shadow: none; border-color: #4f46e5; }
      .print-bar { display: none; }
    }
  </style>
</head>
<body>
  <div>
    <div class="cert-outer">
      <div class="cert-border-inner"></div>
      <div class="cert-corner-tl"></div>
      <div class="cert-corner-tr"></div>
      <div class="cert-corner-bl"></div>
      <div class="cert-corner-br"></div>

      <!-- Header -->
      <div class="header">
        <div class="issuer-brand">
          <div class="issuer-logo">🎓</div>
          <div class="issuer-title">
            <h2>SkillCert 360</h2>
            <p>Certificate Authority</p>
          </div>
        </div>
        <div class="badge-seal">
          <div class="badge-seal-inner">
            <span>OFFICIAL<br>VERIFIED<br>ISSUER</span>
          </div>
        </div>
      </div>

      <!-- Title -->
      <div class="cert-title-container">
        <h1 class="cert-main-title">Certificate of Achievement</h1>
        <p class="cert-subtitle">Official Verified Credential</p>
      </div>

      <!-- Body -->
      <div class="cert-body">
        <p class="recipient-intro">This is proudly presented to</p>
        <h2 class="student-name">${escapeHtml(studentName)}</h2>
        <p class="student-reg">Register Number: ${escapeHtml(registerNumber)}${department ? ` · ${escapeHtml(department)}` : ""}</p>

        <p class="achievement-text">for successfully completing the official course learning and passing the skill assessment for</p>
        <p class="skill-title">${escapeHtml(skillName)} (${escapeHtml(levelName)} Level)</p>

        <div class="course-details">
          <p class="course-title">Course: ${escapeHtml(courseName)}</p>
          <p class="provider-tag">Learning Source / Provider: ${escapeHtml(providerName)}</p>
        </div>

        <!-- Performance Summary -->
        <div class="perf-grid">
          <div class="perf-item">
            <span class="perf-label">Score</span>
            <span class="perf-value cyan">${score} / ${questionCount}</span>
          </div>
          <div class="perf-item">
            <span class="perf-label">Percentage</span>
            <span class="perf-value cyan">${percentage}%</span>
          </div>
          <div class="perf-item">
            <span class="perf-label">Outcome</span>
            <span class="perf-value pass">PASS ✓</span>
          </div>
        </div>
      </div>

      <!-- Footer Metadata -->
      <div class="metadata-footer">
        <div class="meta-block">
          <span class="meta-lbl">Course Completion Date</span>
          <span class="meta-val">${escapeHtml(completionDate)}</span>
        </div>
        <div class="meta-block">
          <span class="meta-lbl">Certificate Issue Date</span>
          <span class="meta-val">${escapeHtml(issuedDate)}</span>
        </div>
        <div class="meta-block right">
          <span class="meta-lbl">Unique Certificate ID</span>
          <span class="meta-val">${escapeHtml(certId)}</span>
        </div>
      </div>
      <div style="margin-top: 12px; text-align: center; font-size: 9px; color: #64748b; letter-spacing: 0.05em;">
        Certificate Issuer: <strong>SkillCert 360</strong> &nbsp;|&nbsp; Learning Provider: <strong>${escapeHtml(providerName)}</strong>
      </div>
    </div>

    <div class="print-bar">
      <button class="print-btn" onclick="window.print()">🖨️ Print / Download Certificate PDF</button>
    </div>
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
