# Security, Error, and Gap Assessment (2026-02-12)

## Scope and Method
- Reviewed API route authentication and authorization patterns.
- Reviewed token/session handling, CORS, and security header behavior.
- Reviewed validation and rate-limiting implementation for logic gaps.

## High Severity Findings

1. **JWT secret has an insecure fallback value**
   - `JWT_SECRET` defaults to a hardcoded string when env is missing.
   - Impact: predictable/shared signing secret can allow token forgery across environments.
   - Evidence: `src/lib/auth-utils.ts` sets `process.env.JWT_SECRET || 'fallback-secret-at-least-32-characters-long'`.

2. **Privilege escalation via self-registration role selection**
   - Public registration accepts an optional `role`, and the created user is assigned `role || 'VIEWER'`.
   - Impact: attacker can self-register as `ADMIN` by passing role in request body.
   - Evidence: `registerSchema` allows optional role, and `/api/v1/auth/register` persists it directly.

3. **Multiple project endpoints appear unauthenticated/unauthorized**
   - Several `/api/v1/projects/[id]/...` routes export handlers directly without `withAuth`, `withAdminAuth`, or equivalent auth checks.
   - Impact: unauthorized data access/modification and integrity compromise.
   - Notable endpoints: `report/generate`, `csrd/assessment`, `data-points`, `workflows`, `materiality/run`, `issb/assessment`, `compliance-checks`, `scope/parse`.

4. **Open Socket.IO CORS policy**
   - Custom server sets Socket.IO CORS `origin: "*"`.
   - Impact: cross-origin abuse surface increases, especially if event auth is weak/misconfigured.

## Medium Severity Findings

5. **Auth token stored in localStorage**
   - Frontend auth context stores bearer token in `localStorage`.
   - Impact: token theft risk under any XSS condition.

6. **CSP permits `unsafe-inline` and `unsafe-eval`**
   - Security headers include `script-src 'unsafe-inline' 'unsafe-eval'`.
   - Impact: significantly weakens XSS defenses.

7. **Project creation missing organization membership/authorization check**
   - Project create verifies organization exists, but does not verify requester belongs to or can write to that organization.
   - Impact: authenticated users may create projects under arbitrary organizations.

## Low Severity Findings / Quality Gaps

8. **Rate-limit response header logic appears incorrect**
   - `withRateLimit` derives limit from `(rateLimiter as any).maxRequests`, but `rateLimiter` is a function that does not expose `maxRequests`.
   - Impact: misleading/inaccurate `X-RateLimit-*` response headers.

9. **In-memory rate limit/blocking state is non-distributed and ephemeral**
   - Rate limits and blocked IPs use in-process `Map`.
   - Impact: ineffective in multi-instance deployments; resets on restart.

10. **Request latency logging bug**
    - `logger.logAPIResponse(req, 201, Date.now() - Date.now())` always logs ~0ms.
    - Impact: observability gap and impaired incident triage.

11. **Client runtime error risk in admin page**
    - File uses `React.useEffect(...)` but does not import `React` namespace in module scope.
    - Impact: potential `React is not defined` runtime/compile issue depending on TS/JSX config.

## Prioritized Remediation Plan

1. **Immediately block role escalation**
   - Ignore client-supplied role in public registration; force `VIEWER`.
   - If elevated onboarding is needed, require admin-only endpoint.

2. **Require strong JWT secret at startup**
   - Remove fallback secret and throw on missing/weak `JWT_SECRET` in non-test environments.

3. **Enforce auth + object-level authorization on all project routes**
   - Wrap all sensitive handlers with auth middleware.
   - Add centralized authorization helper: verify user role + project/org membership per request.

4. **Tighten CORS/CSP**
   - Restrict socket CORS to configured allowlist (`CORS_ORIGIN`).
   - Remove `unsafe-eval`; phase out `unsafe-inline` with nonces/hashes.

5. **Move bearer tokens to secure HTTP-only cookies**
   - Use `SameSite=Lax/Strict`, `Secure`, short-lived access token + refresh strategy.

6. **Harden rate limiting for production**
   - Replace in-memory store with Redis.
   - Fix response header accounting and emit accurate limits.

7. **Fix quality gaps**
   - Correct latency measurement and admin page React import usage.

## Notes
- This assessment is static (code review) and should be followed by dynamic testing (authenticated/unauthenticated endpoint probes, role-escalation tests, and abuse-case simulation).
