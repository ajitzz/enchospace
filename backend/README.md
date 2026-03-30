# ENCHO Backend Foundation

This folder introduces a production foundation scaffold:

- `schema.sql`: marketplace-first relational schema
- `src/server.ts`: minimal API skeleton with health and policy metadata endpoint
- shared contracts in `../contracts/marketplace.ts`

## Next integration steps

1. Replace in-memory frontend booking/policy logic with API calls.
2. Add auth + RBAC middleware.
3. Add listing, booking, payment, and admin modules.
4. Wire payment provider and payout engine.
