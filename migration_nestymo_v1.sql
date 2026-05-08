-- Migration Nestymo Dashboard v1
-- Ajout colonnes CDC (idempotent)

BEGIN;

ALTER TABLE public.annonces
  ADD COLUMN IF NOT EXISTS created_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'annonces_created_by_fkey'
  ) THEN
    ALTER TABLE public.annonces
      ADD CONSTRAINT annonces_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

ALTER TABLE public.agences
  ADD COLUMN IF NOT EXISTS show_phone boolean NOT NULL DEFAULT true;

ALTER TABLE public.agences
  ADD COLUMN IF NOT EXISTS show_email boolean NOT NULL DEFAULT true;

ALTER TABLE public.agences
  ADD COLUMN IF NOT EXISTS show_whatsapp boolean NOT NULL DEFAULT true;

COMMIT;
