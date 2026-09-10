-- sellers.user_id was NOT NULL, which assumes every boutique has a registered
-- account behind it. In practice the 41 catalogue boutiques are records with
-- no owner signed up yet — the column is only populated when a real person
-- claims the store through /sell.
--
-- Making it nullable also lets a boutique exist before its owner registers,
-- which is how onboarding actually works: we list the shop, they claim it.

alter table public.sellers alter column user_id drop not null;

-- The unique index still prevents two accounts claiming one store; Postgres
-- permits multiple NULLs in a unique index, so unclaimed stores coexist.
