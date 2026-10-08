# Security Remediation Plan

## Scope

Address the 2026-10-08 external report without blocking public portfolio visitors.
The report demonstrates failed credential guesses and spoofable visit telemetry,
not successful administrator access or private file contents being read.

## Progress

1. Login protection: implemented, verified, and deployed.
   - Production binding is present: 10 requests / 60 seconds / Cloudflare location.
   - Bounded production check received 429 on request 12, with Retry-After: 60.
   - Replace the shared login key with a Cloudflare client IP key.
   - Record structured failures without credentials, cookies, raw IP, or request bodies.
   - Limit login JSON to 4 KiB and test client isolation and limiter failures.
   - Location-local eventual consistency is not a strict global account lockout.
2. Administrator perimeter: Access policy and signed assertion verification deployed; owner login verification pending.
   - Protect /admin and /api/admin including their descendants, not the whole site.
   - Access was enabled on 2026-10-08, after owner identity confirmation.
   - Only the confirmed owner email is included in the email-PIN allow policy.
   - Application: 05847c87-ee59-4a3f-a56a-5cc3f06b8c9f; session: 8 hours.
   - Public home/detail pages return 200; unauthenticated admin pages/APIs redirect to Access.
   - Owner's real email-PIN/login verification is still required.
   - Verify Access signatures in the Worker for path-based protection.
   - Production workers.dev and preview URLs are already disabled.
   - Preserve the existing application session authentication and local editing.
3. Analytics integrity: pending.
   - Use server-issued expiring anonymous identifiers/tokens with replay controls.
   - Retain request limits and privacy exclusions; do not persist visitor IPs.
   - Anonymous tokens reduce forgery but do not prove a visitor is human.
4. Endpoint hardening and regression verification: pending.
   - Minimize public health details while preserving operational probes.
   - Review logout policy, malformed authentication cookies, and image endpoint exposure.
   - Verify every administrator data route rejects unauthenticated callers.
   - Test public viewing, authorized editing/uploads, and ordinary analytics together.
5. Dependency advisories: newly identified, assessment pending.
   - npm audit --omit=dev reported 46 affected package entries (30 moderate, 15 high, 1 critical).
   - Astro and Tiptap are among the flagged dependencies; assess affected versions/features before updating.
   - Package counts include transitive/build tooling and are not proof of 46 exploitable production flaws.
   - Do not run an unreviewed npm audit fix or introduce major upgrades without regression tests.

## Rollout And Recovery

- Do not activate Access for the entire Worker: public visitors must remain unrestricted.
- Validate owner authentication before declaring Access rollout complete.
- Roll back the perimeter by coordinating the administrator Access application and Worker JWT configuration; removing only the application will leave Worker-side admin requests denied.
- Code changes are not live until Worker deployment. No D1 migration is required for step 1.
- Commit/push only when requested; include HISTORY.md with behavior-changing commits.
