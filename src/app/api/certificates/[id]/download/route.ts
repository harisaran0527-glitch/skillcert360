import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureCertificateNumber } from "@/lib/certificate-number";
import { generateQRCodeSVG } from "@/lib/qr";

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
      skill: { select: { name: true, slug: true, level: { select: { name: true } } } },
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

  // Must be VERIFIED to download
  if (certificate.status !== "VERIFIED") {
    return new Response("Certificate not yet verified.", {
      status: 403,
    });
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

  // Ensure persistent certificate number SC360-XX-YYYY-NNNNNN
  const certNumber = await ensureCertificateNumber(certificate.id);

  const { searchParams, origin } = new URL(request.url);
  const asDownload = searchParams.get("format") === "download";

  const studentName = certificate.student.fullName;
  const registerNumber = certificate.student.registerNumber;
  const department = certificate.student.department?.name ?? "Engineering & Technology";
  const skillName = certificate.skill.name;
  const levelName = certificate.skill.level.name;
  const courseName =
    certificate.course?.title ?? certificate.course?.name ?? "Official Course";
  const providerName = certificate.provider?.name ?? "Official Provider";

  const rawCompletionDate = studentSkill?.completedAt ?? certificate.submittedAt ?? certificate.issueDate ?? certificate.issuedAt ?? certificate.createdAt;
  const completionDate = rawCompletionDate
    ? new Date(rawCompletionDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "N/A";

  const rawIssueDate = certificate.issueDate ?? certificate.issuedAt ?? certificate.verifiedAt ?? certificate.createdAt;
  const issueDate = new Date(rawIssueDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Base URL for QR Verification
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify/${certNumber}`;
  const qrSvg = generateQRCodeSVG(verifyUrl, { size: 100, color: "#1B2A4A", background: "#FFFFFF" });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SkillCert 360 Verified Credential Summary - ${escapeHtml(studentName)} (${escapeHtml(certNumber)})</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    @page {
      size: A4 landscape;
      margin: 0;
    }

    body {
      font-family: 'Inter', sans-serif;
      background-color: #E2E8F0;
      color: #2D3748;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .action-bar {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 100;
      display: flex;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #1B2A4A;
      color: #FFFFFF;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:hover {
      background: #0F172A;
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #FFFFFF;
      color: #1B2A4A;
      border: 1px solid #CBD5E1;
    }

    /* A4 Landscape Container */
    .certificate-container {
      width: 297mm;
      height: 210mm;
      background: #FDFCF8;
      position: relative;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
      padding: 12mm 16mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Outer Outer Border */
    .border-outer {
      position: absolute;
      top: 8mm;
      left: 8mm;
      right: 8mm;
      bottom: 8mm;
      border: 3px solid #1B2A4A;
      pointer-events: none;
    }

    /* Inner Gold Border */
    .border-inner {
      position: absolute;
      top: 10.5mm;
      left: 10.5mm;
      right: 10.5mm;
      bottom: 10.5mm;
      border: 1px solid #C9A84C;
      pointer-events: none;
    }

    /* Background Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      font-family: 'Cinzel', serif;
      font-size: 80px;
      font-weight: 900;
      color: rgba(27, 42, 74, 0.03);
      letter-spacing: 12px;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
    }

    /* Header Section */
    .header {
      text-align: center;
      margin-top: 4mm;
      position: relative;
      z-index: 2;
    }

    .brand-title {
      font-family: 'Cinzel', serif;
      font-size: 26px;
      font-weight: 800;
      color: #1B2A4A;
      letter-spacing: 4px;
      text-transform: uppercase;
    }

    .brand-sub {
      font-size: 10px;
      font-weight: 600;
      color: #C9A84C;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .cert-heading {
      font-family: 'Cinzel', serif;
      font-size: 20px;
      font-weight: 700;
      color: #1B2A4A;
      letter-spacing: 2px;
      margin-top: 6mm;
      text-transform: uppercase;
    }

    .divider-gold {
      width: 120px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #C9A84C, transparent);
      margin: 6px auto 0;
    }

    /* Body Section */
    .cert-body {
      text-align: center;
      margin-top: 4mm;
      position: relative;
      z-index: 2;
    }

    .certify-text {
      font-size: 13px;
      color: #64748B;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 500;
    }

    .student-name {
      font-family: 'Cinzel', serif;
      font-size: 30px;
      font-weight: 800;
      color: #1B2A4A;
      margin: 6px 0 2px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .student-meta {
      font-size: 12px;
      color: #475569;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .course-details {
      font-size: 13px;
      color: #334155;
      line-height: 1.6;
      max-width: 820px;
      margin: 0 auto;
    }

    .course-name {
      font-family: 'Cinzel', serif;
      font-size: 18px;
      font-weight: 700;
      color: #1B2A4A;
      display: inline-block;
      margin: 2px 0;
    }

    .highlight {
      font-weight: 700;
      color: #1B2A4A;
    }

    .provider-tag {
      display: inline-block;
      margin-top: 4px;
      background: #F1F5F9;
      color: #475569;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 12px;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
    }

    /* Metrics Badge */
    .metrics-container {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 5mm;
    }

    .metric-badge {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      padding: 6px 20px;
      border-radius: 6px;
      text-align: center;
    }

    .metric-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 15px;
      font-weight: 800;
      color: #1B2A4A;
      margin-top: 1px;
    }

    .pass-tag {
      color: #15803D;
    }

    /* Footer Section */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 4mm;
      padding: 0 10mm;
      position: relative;
      z-index: 2;
    }

    .footer-col {
      flex: 1;
    }

    .footer-left {
      text-align: left;
    }

    .footer-center {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .footer-right {
      text-align: right;
    }

    .meta-item {
      font-size: 11px;
      color: #64748B;
      margin-bottom: 3px;
    }

    .meta-item strong {
      color: #1B2A4A;
      font-weight: 600;
    }

    .cert-id-badge {
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      color: #1B2A4A;
      background: #F8FAFC;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px dashed #CBD5E1;
      display: inline-block;
      margin-top: 4px;
    }

    .qr-box {
      background: #FFFFFF;
      padding: 6px;
      border-radius: 6px;
      border: 1px solid #E2E8F0;
      display: inline-block;
    }

    .qr-caption {
      font-size: 8px;
      font-weight: 600;
      color: #64748B;
      letter-spacing: 0.5px;
      margin-top: 3px;
      text-transform: uppercase;
    }

    .seal-img {
      width: 70px;
      height: 70px;
      margin-left: auto;
      margin-bottom: 4px;
    }

    .issuer-note {
      font-size: 10px;
      font-weight: 700;
      color: #1B2A4A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .issuer-sub {
      font-size: 9px;
      color: #64748B;
    }

    @media print {
      body {
        background: none;
        padding: 0;
      }
      .action-bar {
        display: none !important;
      }
      .certificate-container {
        box-shadow: none;
        width: 297mm;
        height: 210mm;
      }
    }
  </style>
</head>
<body>

  <div class="action-bar">
    <button onclick="window.print()" class="btn">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"></path></svg>
      Print / Save as PDF
    </button>
  </div>

  <div class="certificate-container">
    <div class="border-outer"></div>
    <div class="border-inner"></div>
    <div class="watermark">SKILLCERT 360</div>

    <!-- Header -->
    <div class="header">
      <div class="brand-title">SkillCert 360</div>
      <div class="brand-sub">Skill Learning, Credential Vault & Verification Platform</div>
      <div class="cert-heading">Verified Credential Summary</div>
      <div class="divider-gold"></div>
    </div>

    <!-- Body -->
    <div class="cert-body">
      <div class="certify-text">This is to certify that</div>
      <div class="student-name">${escapeHtml(studentName)}</div>
      <div class="student-meta">Register No: ${escapeHtml(registerNumber)} &nbsp;|&nbsp; Dept: ${escapeHtml(department)}</div>

      <div class="course-details">
        has earned a verified external learning credential for
        <br>
        <span class="course-name">${escapeHtml(courseName)}</span>
        <br>
        in the domain of <span class="highlight">${escapeHtml(skillName)} (${escapeHtml(levelName)})</span>.
        <br>
        <span class="provider-tag">Original Certificate Issuer: ${escapeHtml(providerName)}</span>
      </div>

      <!-- Verification Badge -->
      <div class="metrics-container">
        <div class="metric-badge">
          <div class="metric-label">Verification Status</div>
          <div class="metric-value pass-tag">VERIFIED CREDENTIAL</div>
        </div>
        <div class="metric-badge">
          <div class="metric-label">Record Management</div>
          <div class="metric-value">SkillCert 360</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-col footer-left">
        <div class="meta-item">Completion Date: <strong>${escapeHtml(completionDate)}</strong></div>
        <div class="meta-item">Issue Date: <strong>${escapeHtml(issueDate)}</strong></div>
        <div class="meta-item" style="margin-top: 6px;">Verification Record ID:</div>
        <div class="cert-id-badge">${escapeHtml(certNumber)}</div>
      </div>

      <div class="footer-col footer-center">
        <div class="qr-box">
          ${qrSvg}
        </div>
        <div class="qr-caption">Scan to Verify Authenticity</div>
      </div>

      <div class="footer-col footer-right">
        <!-- SVG Seal Graphic -->
        <svg class="seal-img" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" stroke="#1B2A4A" stroke-width="3" fill="#FDFCF8"/>
          <circle cx="50" cy="50" r="40" stroke="#C9A84C" stroke-width="1.5" stroke-dasharray="4 2"/>
          <path d="M50 20 L58 35 L75 38 L62 50 L65 67 L50 58 L35 67 L38 50 L25 38 L42 35 Z" fill="#1B2A4A"/>
          <circle cx="50" cy="50" r="14" fill="#C9A84C"/>
          <path d="M44 50 L48 54 L56 45" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="issuer-note">Original Certificate Issuer: ${escapeHtml(providerName)}</div>
        <div class="issuer-sub">Verification & Record Management: SkillCert 360</div>
      </div>
    </div>
  </div>

  ${
    asDownload
      ? `<script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>`
      : ""
  }
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
