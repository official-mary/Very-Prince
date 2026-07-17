# Add indexing to the organization_id column in PostgreSQL

## Overview
This PR adds the missing database index for the `orgId` (organization ID) column in the `Maintainer` table in PostgreSQL, matching the index definition in the Prisma schema (`schema.prisma`). It also includes a unit test to verify that the index exists in the database migrations.

## What changed
- **Database Migrations**: Created a new Prisma migration (`20260717120000_add_maintainer_org_id_index`) containing the SQL command `CREATE INDEX "Maintainer_orgId_idx" ON "Maintainer"("orgId")` to create the index in PostgreSQL.
- **Backend Tests**: Created [databaseSchema.test.ts](file:///c:/Users/Hp/Desktop/111/Very-Prince/packages/backend/src/tests/databaseSchema.test.ts) to read the migration SQL files and assert that the `Maintainer_orgId_idx` index creation statement is present.

## Why
The index `@@index([orgId])` was defined in the Prisma schema `schema.prisma` but was missing from the initial migration SQL script. Adding this index resolves the discrepancy and optimizes query performance when retrieving maintainers by organization ID.

## Verification
- Verified that the migration SQL syntax matches PostgreSQL specifications.
- Verified that the unit test correctly asserts the index's presence in the migrations directory.
