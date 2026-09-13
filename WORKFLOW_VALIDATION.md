# SkillCert 360 workflow validation

## Validation resumed on 2026-09-13

Existing features were retained, including the Playwright `Emulation.setFocusEmulationEnabled({ enabled: false })` fix for actual tab visibility and focus events. Final browser validation uses headless Microsoft Edge against the production app at `http://localhost:3000`, backed by the configured PostgreSQL database.

| Command | Actual result |
| --- | --- |
| `npx.cmd prisma validate` | PASS |
| `npx.cmd prisma generate` | PASS |
| `npx.cmd prisma db push` | PASS; fractional cooldown column synchronized without resetting data |
| `npx.cmd tsc --noEmit` | PASS |
| `npm.cmd run build` | PASS; 38 pages generated |
| `npx.cmd tsx scripts/e2e-workflow.ts` | PASS; exit 0, 21 check groups, `completed: true`, no page errors |
| `npx.cmd tsx scripts/e2e-security.ts` | PASS; exit 0, 12 check groups, no test data left behind |

The `.cmd` commands are the Windows equivalents of the requested `npm`/`npx` commands. This machine's PowerShell policy blocks the `.ps1` wrappers; its execution policy was not changed.

Workflow evidence: `test-results/workflow-report.json`, run `E2E-1789267462564`. Screenshots `test-results/student-verified.png` and `test-results/student-360.png` were inspected. The workflow and its included security checks completed with no skipped checks. Earlier unsuccessful runs are documented below; they do not count as passes.

## Verified workflow and security results

| Requested behavior | Verified result |
| --- | --- |
| Admin login → create student → student login → first password change | PASS through browser forms; API access blocked before password change |
| Select skill → Learn Officially → mark complete | PASS; assessment blocked both before learning and after opening the course but before completion; forged completion fields rejected |
| Answer secrecy and assignment | PASS; live payload excludes keys/explanations, early results redirect, unassigned questions rejected on both save and submit |
| Client score tampering | PASS; forged score/pass fields rejected; grading uses server answers |
| Multiple/concurrent attempts | PASS; simultaneous first starts create one attempt, existing starts resume it, a second skill is blocked, another client/tab cannot claim it |
| Refresh | PASS; expiration timestamp unchanged and saved answer restored |
| Tab switch / page hidden / blur / fullscreen exit | PASS with native browser state and timestamped database records |
| Violation count and limits | PASS; UI shows 3/4 before termination and 0/1 before auto-submit; browser fullscreen exit reaches each limit; concurrent events are retained |
| Termination versus auto-submit | PASS; disabled auto-submit fails even with 2/2 saved correct answers; enabled auto-submit grades 1/2 as a pass at pass mark 1 and unlocks the certificate |
| Failed attempt → cooldown → randomized re-exam → pass | PASS; stored cooldown is 0.005 hours, exact delay 18 seconds, early start returns 429, real elapsed cooldown permits attempt 2 |
| Submitted attempt edits and duplicates | PASS; answer records, score, submission time, cooldown and finalization count unchanged after duplicate submission and save |
| Deadline enforcement | PASS; late answers excluded, saved answers graded with `TIMEOUT` |
| Certificate locked until pass | PASS; direct submission rejected before pass, including when certificate-prerequisite requirement is disabled |
| Submission → request resubmission → resubmit → rejection → resubmit → approval | PASS; URL-only and ID-only submissions accepted and review history retained |
| Student Verified and Admin Student 360 | PASS; student skill and timestamp updated, exact dashboard counts checked, both attempts/all signal types/review statuses/ordered lifecycle visible |
| Admin settings enforced | PASS; question count, duration, pass mark, violation limit, fractional cooldown, both auto-submit modes, both prerequisite-certificate modes and immutable active settings |
| Ownership, role and disabled sessions | PASS; all assessment actions reject another student's session, student cannot edit admin settings, disabling an account invalidates existing-session access |

The failure's manual submission was stored at `2026-09-13T02:47:27.646Z`, with re-exam available at `2026-09-13T02:47:45.646Z`. Boundary-only security fixtures shorten an isolated expiry and move isolated cooldown timestamps to exercise additional cases; the main workflow's cooldown elapsed naturally without database bypass.

## Issues found and fixed during this validation

- **Fractional cooldown was lost:** the admin UI/API accepted `0.005` hours, but `AssessmentAttempt.cooldownHours` was an integer and stored `0`. A failed attempt could immediately start again. The field is now `Float`. Regression assertions check the stored value, the exact 18-second deadline, rejection before that deadline, and re-exam after real time elapses.
- **Standalone security command silently ran no checks:** `e2e-security.ts` previously only exported a function. It now has a runnable entry point using the existing authenticated fixture setup and cleanup, and writes a separate security report.
- **Default browser emulation masked native visibility:** a minimal probe demonstrated that the extra CDP session's focus fix allowed blur but did not remove the visibility override installed by Playwright's original session. `e2e-browser.ts` now launches a separate temporary headless Edge profile and connects with `noDefaults: true` for the student's default context. Native tab activation produces `document.hidden === true`; no visibility properties or events are fabricated. The existing focus fix is retained, and tests explicitly wait for visible/hidden states.
- **Popup timeout could bypass cleanup:** an independently awaited popup promise could reject before the click completed, terminating Node before `finally`. The click and popup are now awaited together, and settings/level backups are written before any test changes.
- **Pooled database retained the old query result type after schema synchronization:** the production run encountered PostgreSQL `cached plan must not change result type`. Local `.env` now enables `pgbouncer=true`, and the app was restarted. Credentials were preserved. Prisma documents this setting's prepared-statement behavior in its [PostgreSQL connector reference](https://www.prisma.io/docs/orm/v6/overview/databases/postgresql).
- **Coverage gaps:** assertions now cover simultaneous first starts, a different skill during an active attempt, unassigned questions on submission, post-submit answer/timestamp immutability, exact dashboard counts, Student 360 history, and both certificate-prerequisite settings. Browser boundary tests check displayed counts below the limit and real fullscreen exits that trigger termination and auto-submit.

The aborted production run's uniquely identified fixtures were removed. Because that run had no persisted pre-run settings backup, its overwritten settings could not be reconstructed exactly. The documented defaults were restored: 50 questions, 45 minutes, 3 violations, 6-hour cooldown, certificate requirement and auto-submit enabled, and Beginner/Foundation/Intermediate/Advanced/Professional pass marks 30/30/32/35/35. Any previous custom values require confirmation. Subsequent runs save a backup and restore their starting values.

## Running the suites

Run the app with access to the configured PostgreSQL database, then run both commands below sequentially. The workflow also invokes the security checks. Set `E2E_BASE_URL` for a different local app URL. Run against a development/test database, with no simultaneous settings edits: the suites temporarily change global assessment settings and restore them afterward.

```powershell
npx.cmd tsx scripts/e2e-security.ts
npx.cmd tsx scripts/e2e-workflow.ts
```

The suite creates uniquely named test accounts, a skill, an official course and a question bank. It exercises real login cookies, forms, browser fullscreen, API routes and database persistence. Its cleanup removes only its fixtures. Results and screenshots are written to `test-results/`.

Coverage includes login, student creation, forced password change, learning completion, assessment prerequisites, fixed deadlines across refresh, question secrecy, ownership, unauthorized questions, score tampering, concurrent starts, tab ownership, violation events, failure, real cooldown wait, randomized re-exam, pass, certificate unlock, URL/ID submissions, rejection, resubmission, approval, dashboard counts and Student 360.

Additional boundary fixtures test expiry with late answers, concurrent violation logging, both violation-limit actions and disabled-account sessions.

## Rules

- Pass marks are numbers of correct answers. They must be between 1 and the configured question count. The question bank must contain enough active automatically gradable questions.
- Each attempt snapshots its questions, answer keys and settings. Answers and grading stay on the server. An attempt cannot be changed after finalization.
- Student-row database locks serialize starts, submissions, violations, learning changes and certificate reviews.
- At the violation limit, enabled auto-submit grades saved answers; disabled auto-submit terminates the attempt as failed.
- Violation count is the number of recorded signals. One hidden-tab transition emits `TAB_SWITCH` and `PAGE_HIDDEN`, with `WINDOW_BLUR` recorded separately.
- Duplicate assessment submissions are idempotent: the server returns the existing result with HTTP 200 and performs no second finalization or answer changes. They are blocked from creating duplicate effects, rather than rejected with an HTTP error.
- Expiry is enforced by the server on every attempt request. Overdue attempts are finalized when the student resumes or relevant dashboards/reports load, even if the browser was closed.
- Certificate requirement controls whether prerequisite completion needs a verified credential. Turning it off permits a passed prerequisite assessment; it never allows certificates to bypass an assessment pass.
- Browser fullscreen and visibility signals are client observations. Browsers cannot provide tamper-proof proctoring against modified client code; the server still independently enforces ownership, deadlines, grading, cooldown and finalization.
- Learning completion records the student's declaration after opening an official course. No provider completion API is configured.

## File storage

Certificate file upload is currently disabled; the handlers support URL/credential-ID submissions, not multipart uploads. External file storage integration and configuration remain future work and were not counted as passing tests. URL-only and credential-ID-only submissions, issue dates, reviews, verification identity and review history work independently of file storage.

## Local startup and external requirements

From the current workspace, run `npm.cmd run dev` and open `http://localhost:3000`. To run the already built production version, use `npm.cmd run start`. Stop any existing server on port 3000 before switching modes.

The local `.env` must contain a reachable PostgreSQL `DATABASE_URL` and a `SESSION_SECRET` of at least 32 characters; both were available for this validation. Microsoft Edge must be installed for these test scripts. Deployment requires its own database/session environment and HTTPS for production session cookies. Provider-side learning verification and issuer-side credential validation are not configured: learning is a student declaration after opening an official course, and certificate approval is an administrator's review. These external integrations were not exercised or represented as complete.
