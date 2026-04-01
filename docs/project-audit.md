# Project Micro-Level Audit (April 1, 2026)

## Scope
- Host flow (`/host`)
- Public browsing and booking flow (`/`, `/payment`)
- Admin panel (`/admin`)
- API/backend reliability and security posture

## Executive rating
- **Overall working score: 6.9 / 10**
- **Host page score: 7.2 / 10** (good UX, incomplete validation/permissions)
- **Admin panel score: 5.8 / 10** (good listing table, missing real admin controls)
- **Booking + payment score: 6.5 / 10** (flow exists, but state persistence gaps)
- **Backend/API score: 7.0 / 10** (solid skeleton, security and lifecycle hardening needed)

## What already works well
1. **End-to-end core shape exists**
   - Property creation, listing retrieval, deletion, booking creation, and Stripe checkout endpoints are implemented.
2. **UI quality is strong**
   - Host and Admin pages have clean layout, clear hierarchy, and responsive patterns.
3. **Operational helpers exist**
   - Health endpoint and DB keepalive endpoint are present.
4. **Caching and media upload included**
   - Redis cache path and S3 presigned upload path are integrated.

## Critical gaps and risks

### A) Access control and authorization
- Host/Admin routes check only whether a session exists on the client.
- There is no role/ownership validation on backend create/delete endpoints.
- `owner_id` can be sent by client and trusted directly.

**Impact:** Any logged-in user could potentially perform admin-like actions.

### B) Data validation
- Backend accepts payloads without schema-level validation.
- Price/date/title constraints rely mostly on client behavior.

**Impact:** Invalid or malicious payloads can be inserted.

### C) State continuity bugs
- Payment page depends on `location.state`; refresh/deep-link loses booking context.
- Success redirect behavior exists, but no robust retrieval path for pending booking context.

**Impact:** Users can hit “No booking details found” and drop out.

### D) Product completeness mismatches
- Admin “Add Property” and “Edit” actions are not wired to behavior.
- Reservations list in Home is not populated from backend; reservation UX is mostly visual placeholder.
- Some "show more" and contact actions are UI-only.

**Impact:** Feels polished but partially non-functional beyond happy path.

### E) Security posture
- DB connection has a hardcoded fallback credential string.
- `cors()` is wide open by default.
- Rate limiting, CSRF strategy, and audit logging are absent.

**Impact:** Elevated production risk.

## Priority improvement roadmap

### P0 (immediate, 1–3 days)
1. Add backend validation (e.g., Zod/Joi) for all write endpoints.
2. Enforce auth + role checks server-side for host/admin actions.
3. Remove hardcoded DB fallback credentials; fail fast if env is missing.
4. Restrict CORS to explicit origins.
5. Return detailed error responses for host/admin submission failures.

### P1 (next, 3–7 days)
1. Implement admin edit/add actions with actual APIs.
2. Add owner-based filtering in admin or real role-based management.
3. Persist booking state in DB/session and load by ID in `/payment`.
4. Populate reservations from `/api/bookings` and connect to UI.

### P2 (quality, 1–2 weeks)
1. Add optimistic UI + retry patterns for uploads.
2. Add file size/type validation both frontend and backend.
3. Add integration tests for host->listing->booking->payment flow.
4. Add structured logging and monitoring dashboards.

## Definition of “production ready” target
- Authz checked on **every** write endpoint.
- No client-trusted identity fields.
- Validation errors are explicit and user-friendly.
- Payment flow survives page refresh and webhook race conditions.
- Admin operations are fully wired and role protected.

If these are completed, the project can move from ~6.9/10 toward **8.5+/10** reliability and completion.
