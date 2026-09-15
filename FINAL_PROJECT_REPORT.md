# SkillCert 360 - Final Project Report

## Project Objective
SkillCert 360 is a student skill-learning, assessment, and certification platform designed to validate student proficiency across multi-level technical skills and specialized domain courses. It provides course-specific learning verification, randomized online assessments, anti-cheating monitoring, automated scoring, and verifiable dynamic certificates with QR-based public verification.

---

## Technology Stack
- **Framework**: Next.js 16 (App Router with Turbopack) & React 19
- **Database & ORM**: PostgreSQL with Prisma ORM 6.19
- **Authentication & Security**: HTTP-only JWT sessions (`jose`), `bcryptjs` password hashing, RBAC (STUDENT / ADMIN)
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Certificate Generation**: Server-side dynamic HTML/CSS rendering with SVG/QR generation; students use browser Print / Save as PDF
- **Deployment**: Vercel Serverless & Edge Network

---

## Current Confirmed Dataset
- **Active Courses**: 592 active courses across beginner, intermediate, and advanced levels
- **Question Bank**:
  - 592 active courses each have exactly 300 course-linked active questions
  - 177,600 course-linked active questions
  - 65 additional legacy/unlinked active questions
  - **177,665 total active questions**
- **Enrolled Students**: 40 registered student profiles
- **Vercel Deployment**: Configured and deployment successful (`postinstall: prisma generate` integrated)

> **Note**: External course URLs have not been independently verified for all 592 courses; data reflects what is recorded in the database.

---

## Student Workflow
1. **Student Login**: Authenticates via `/student/login` with register number/email and credentials.
2. **Course & Skill Selection**: Explores catalog or assigned skills and selects a specific course provider.
3. **Mark Learning Complete**: Completes external/internal course requirements and marks progress.
4. **Certificate Request**: Submits a formal certificate request form with read-only verification fields, completion date, and required completion declaration checkbox.
5. **Assessment**: Enters a timed assessment environment with anti-violation monitoring.
6. **PASS/FAIL Evaluation**: Server evaluates submissions instantaneously against course pass thresholds.
7. **Result Page & Locking Logic**:
   - **FAIL**: Certificate remains **LOCKED**. Re-exam cooldown timer is enforced before retry with new shuffled questions.
   - **PASS**: Certificate is immediately **UNLOCKED** and issued with a unique certificate number.
8. **View & Download Certificate**: Displays a printable dynamic certificate with Print / Save as PDF.
9. **Public QR Verification**: Scanning QR code or visiting `/verify/[certificateNumber]` grants public verification without requiring student login.

---

## Assessment Architecture
- **300 Course-Specific Question Bank**: Each active course maintains exactly 300 active, automatically gradable questions.
- **Randomized 50-Question Pool**: Every attempt randomly samples 50 non-repeating questions mapped strictly to the chosen course and skill.
- **PASS/FAIL & Locking Logic**:
  - Minimum passing mark configured per level (e.g., 70%).
  - Certificates stay locked (`status: LOCKED`) until a passing attempt is recorded (`passed: true`).
- **Parallel Assessment Behaviour**:
  - **Same skill**: A duplicate active attempt for the same skill is blocked and the existing active attempt is resumed.
  - **Different skills**: Parallel active assessments across different skills are permitted.
  - Heartbeat checks, violation caps (tab switches, full-screen exits), and automatic submission upon threshold breach.

---

## Dynamic Certificate & Public Verification System
- **Unique Certificate Number**: Format `SC360-{SKILL_CODE}-{YEAR}-{NNNNNN}` (e.g., `SC360-CS-2026-000042`) generated upon passing attempt.
- **Attribution & Transparency**:
  - **Certificate Issuer**: SkillCert 360
  - **Learning Source**: External Course Provider (e.g., Cisco, Coursera, IBM)
- **Public Verification (`/verify/[certificateNumber]`)**:
  - Accessible to external recruiters/employers without authentication.
  - Displays verified student name, register number, course title, issue date, and validation status.

---

## Security & Database Controls
- Strict server-side session checks and middleware authorization.
- Cross-student certificate isolation: direct downloads verify ownership before serving files; certificate responses use private, no-store caching controls.
- Relational integrity maintained via Prisma ORM schema models.

---

## Production Readiness Status
- **End-to-End Workflow**: VERIFIED (PASS)
- **Certificate Locking/Unlock**: VERIFIED (PASS)
- **Public QR Verification**: VERIFIED (PASS)
- **Authorization & Security**: VERIFIED (PASS)
- **Prisma Schema & Client Generation**: VERIFIED (PASS)
- **TypeScript Typecheck**: VERIFIED (PASS)
- **Production Next.js Build**: VERIFIED (PASS)

**Status**: READY FOR FINAL DEMO / DEPLOYED AND VERIFIED
