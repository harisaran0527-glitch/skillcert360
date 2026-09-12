# SkillCert 360 workflow validation

Run the app with access to the configured PostgreSQL database, then run `npm run test:e2e`. The test uses Microsoft Edge in headless mode. Set `E2E_BASE_URL` for a different local app URL. Run against a development/test database, with no simultaneous settings edits: the suite temporarily changes global assessment settings and restores them afterward.

The suite creates uniquely named test accounts, a skill, an official course and a question bank. It exercises real login cookies, forms, browser fullscreen, API routes and database persistence. Its cleanup removes only its fixtures. Results and screenshots are written to `test-results/`.

Coverage includes login, student creation, forced password change, learning completion, assessment prerequisites, fixed deadlines across refresh, question secrecy, ownership, unauthorized questions, score tampering, concurrent starts, tab ownership, violation events, failure, real cooldown wait, randomized re-exam, pass, certificate unlock, URL/ID submissions, rejection, resubmission, approval, dashboard counts and Student 360.

Additional boundary fixtures test expiry with late answers, concurrent violation logging, both violation-limit actions and disabled-account sessions.

## Rules

- Pass marks are numbers of correct answers. They must be between 1 and the configured question count. The question bank must contain enough active automatically gradable questions.
- Each attempt snapshots its questions, answer keys and settings. Answers and grading stay on the server. An attempt cannot be changed after finalization.
- Student-row database locks serialize starts, submissions, violations, learning changes and certificate reviews.
- At the violation limit, enabled auto-submit grades saved answers; disabled auto-submit terminates the attempt as failed.
- Expiry is enforced by the server on every attempt request. Overdue attempts are finalized when the student resumes or relevant dashboards/reports load, even if the browser was closed.
- Certificate requirement controls whether prerequisite completion needs a verified credential. Turning it off permits a passed prerequisite assessment; it never allows certificates to bypass an assessment pass.
- Browser fullscreen and visibility signals are client observations. Browsers cannot provide tamper-proof proctoring against modified client code; the server still independently enforces ownership, deadlines, grading, cooldown and finalization.
- Learning completion records the student's declaration after opening an official course. No provider completion API is configured.

## File storage

External certificate file upload requires storage configuration. URL-only and credential-ID-only submissions, issue dates, reviews, verification identity and review history work independently of file storage.
