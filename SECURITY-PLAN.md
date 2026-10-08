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
3. Analytics integrity: implemented and pushed; production rollout verification pending.
   - Use server-issued expiring anonymous identifiers/tokens with replay controls.
   - Retain request limits and privacy exclusions; do not persist visitor IPs.
   - Anonymous tokens reduce forgery but do not prove a visitor is human.
4. Endpoint hardening and regression verification: implemented locally; verification recorded in HISTORY.md, deployment pending.
   - Minimize public health details while preserving operational probes.
   - Review logout policy, malformed authentication cookies, and image endpoint exposure.
   - Verify every administrator data route rejects unauthenticated callers.
   - Test public viewing, authorized editing/uploads, and ordinary analytics together.
   - Public health retains only overall status and HTTP 200/503; database failure details remain in server logs.
   - Logout now requires a valid CMS session and matching mutation Origin; it clears only the browser cookie, not copied stateless sessions or Access.
   - Reject malformed/oversized/extra-segment CMS tokens without throwing or issuing cookies.
   - Disable the unused /_image optimizer with identical 404 responses; R2 media/static assets remain available.
5. Dependency advisories: updates implemented locally; final regression results recorded in HISTORY.md, deployment pending.
   - npm audit --omit=dev reported 46 affected package entries (30 moderate, 15 high, 1 critical).
   - Astro and Tiptap are among the flagged dependencies; assess affected versions/features before updating.
   - Package counts include transitive/build tooling and are not proof of 46 exploitable production flaws.
   - Do not run an unreviewed npm audit fix or introduce major upgrades without regression tests.
   - Astro 7.3.7, Cloudflare adapter 14.3.4, React adapter 6.0.6, Tiptap 3.31.4, sanitize-html 2.18.0, Sharp 0.35.5, Wrangler 4.148.0.
   - Regenerated the inconsistent peer/lock graph without --force or --legacy-peer-deps; existing root major ranges remain intact.
   - A temporary override targets only miniflare -> sharp 0.35.5: upstream Miniflare still pins 0.35.4. Remove/review it when the upstream pin is patched.
   - Full npm audit now reports zero known vulnerabilities; this is not a guarantee of overall application security.
   - Regression tests cover Tiptap prototype-key attribute merging and portfolio SVG/rich-text exclusions.

## Dependency Exposure Assessment

- Astro AVIF optimization advisory requires processing untrusted AVIF images. This project uses Cloudflare passthrough and R2 variants and blocks the unused /_image route; no active AVIF optimizer exposure was identified. Astro is still patched rather than relying only on this configuration.
- Astro base-path stripping and view-transition issues were reviewed against source: no configured base or ClientRouter/view-transition attribute usage was identified.
- Tiptap runs in the administrator editor. Standard fixed schemas and server HTML sanitization reduce imported-attribute exposure, but browser paste handling still justifies upgrading Tiptap/ProseMirror. The Markdown extension is not enabled.
- sanitize-html is used at storage and rendering boundaries. Portfolio rules already reject SVG and every HTML attribute; the library is patched as defense in depth.
- Miniflare, Undici, TOML, source maps and CSS/SVG tooling advisories include development/build dependencies pulled in by the Cloudflare adapter. Their audit presence is not proof those parsers run in public Worker requests. They were refreshed with the compatible dependency graph.
- Primary advisories: [Astro AVIF](https://github.com/withastro/astro/security/advisories/GHSA-26w7-cxv4-gfx2), [Tiptap attribute merging](https://github.com/ueberdosis/tiptap/security/advisories/GHSA-cp6q-959q-f8rh), [ProseMirror paste](https://github.com/ProseMirror/prosemirror-view/security/advisories/GHSA-c8x8-7fp4-3x9w), [Sharp librsvg](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w).

## Rollout And Recovery

- All five planned code-remediation steps are implemented and locally verified. Completion still requires releasing the remaining commits and checking the production deployment, real owner Access/CMS login, editing/uploads, public pages and analytics.
- Review the temporary Miniflare Sharp override during future dependency maintenance; zero audit findings is not a permanent security guarantee.
- Do not activate Access for the entire Worker: public visitors must remain unrestricted.
- Validate owner authentication before declaring Access rollout complete.
- Roll back the perimeter by coordinating the administrator Access application and Worker JWT configuration; removing only the application will leave Worker-side admin requests denied.
- Code changes are not live until Worker deployment. No D1 migration is required for step 1.
- Commit/push only when requested; include HISTORY.md with behavior-changing commits.
