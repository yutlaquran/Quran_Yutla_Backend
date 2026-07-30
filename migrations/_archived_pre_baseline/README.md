# Archived pre-baseline migrations

These migrations predate `1733000000000-BaselineSchema.ts` and were
squashed into it. As a standalone chain they never produced a correct
schema (incomplete table coverage, an out-of-order ALTER-before-CREATE,
and a destructive DROP COLUMN), so the schema was only ever built by
TypeORM's `synchronize`.

The baseline reproduces the full end state of every migration here. They
are kept for history only and are intentionally outside the datasource
glob (`dist/migrations/*`), so they are never loaded or executed.

Do not move them back into `migrations/` — on a fresh database they would
run after the baseline and fail.
