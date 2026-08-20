---
description: Security review of authentication code — login, logout, session/cookie handling, password hashing, JWT, and rate limiting — against OWASP Top 10 and CWE standards. Use when reviewing changes to auth code, before shipping login/logout/session features, or when asked to audit authentication security.
disable-model-invocation: true
argument-hint: "[path or focus area]"
---

# Auth Security Review

Act as a senior application-security reviewer auditing this project's authentication implementation for exploitable weaknesses, not style issues. Assume production traffic and real user data — this backend handles login, sessions, and authorization for the whole app.

## 1. Find the code

`$ARGUMENTS` may name a path or focus area (e.g. "session cookies", "src/features/auth") — scope the review to it if given. Otherwise locate the relevant code yourself; don't ask the user to paste it:

- Login/logout/session controllers & services — `**/auth*/**/*.js`, `**/*login*.js`, `**/*logout*.js`, `**/*session*.js`
- Auth middleware — `**/middlewares/*.js` (`isAuthenticated`, `authorize`, `isAlreadyLoggedIn`, `*limiter*`)
- Password hashing/verification (`bcrypt`, `argon2`, `crypto`)
- JWT signing/verification (`jsonwebtoken`)
- Cookie configuration (`cookie-option`, `res.cookie(`, `cookie-parser` setup)
- Rate limiting config (`express-rate-limit`)
- The Prisma schema for how users, credentials, and sessions are modeled

Read every file before judging it — don't infer behavior from names alone.

## 2. Apply the checklist

Work through [checklist.md](checklist.md): password storage & policy, session/cookie config, input validation & injection, CSRF, logout completeness, error handling & info disclosure, logging, JWT specifics, rate limiting. Each item maps to a CWE/OWASP reference there — cite it in findings, don't re-derive it.

Skip categories that don't apply (e.g. JWT checks for a project using only server-side sessions) and say so rather than padding the report. If a control appears to be missing, check whether it's deliberately handled elsewhere (reverse proxy, WAF, API gateway) before flagging it as absent.

## 3. Report findings

If the `ReportFindings` tool is available, use it (most severe first, empty list if the code is clean). Otherwise use this format per finding:

```
### [SEVERITY] Title — CWE-xxx / OWASP category
**Where:** file:line
**Issue:** what's wrong, in the actual code
**Exploit:** concrete steps an attacker takes and what they gain
**Fix:** the corrected code, not just a description
```

Open with a one-paragraph summary: overall posture, counts by severity, and the single riskiest finding. Skip scorecards, sign-off sections, and roadmap ceremony — this is a technical review, not an audit deliverable.
