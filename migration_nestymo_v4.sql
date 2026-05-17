-- Migration Nestymo Agence V4 (CDC Nestymo Agence V1)
-- A executer manuellement dans Supabase SQL Editor

BEGIN;

-- 1) Agrement MCLU (texte libre, nullable)
ALTER TABLE public.agences
  ADD COLUMN IF NOT EXISTS numero_agrement_mclu text;

-- 2) Enum abonnement_plan : valeur starter (alignement code / UI)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'abonnement_plan'
      AND e.enumlabel = 'starter'
  ) THEN
    ALTER TYPE public.abonnement_plan ADD VALUE 'starter';
  END IF;
END $$;

COMMIT;
