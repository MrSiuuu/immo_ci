-- Migration Nestymo Admin V2
-- A executer manuellement dans Supabase SQL Editor

BEGIN;

-- 1) annonce_statut: ajouter en_attente_validation + refuse
DO $$
BEGIN
  ALTER TYPE public.annonce_statut ADD VALUE IF NOT EXISTS 'en_attente_validation';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE public.annonce_statut ADD VALUE IF NOT EXISTS 'refuse';
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 2) contacts.source + contacts.is_read
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'formulaire';

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'contacts_source_check'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_source_check
      CHECK (source IN ('whatsapp', 'telephone', 'formulaire'));
  END IF;
END $$;

-- 3) contact_statut: nouveau set de valeurs (nouveau, contacte, converti, perdu)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'contact_statut'
  ) THEN
    ALTER TABLE public.contacts
      ALTER COLUMN statut DROP DEFAULT;

    ALTER TABLE public.contacts
      ALTER COLUMN statut TYPE text USING statut::text;

    DROP TYPE public.contact_statut;
  END IF;
END $$;

CREATE TYPE public.contact_statut AS ENUM ('nouveau', 'contacte', 'converti', 'perdu');

UPDATE public.contacts
SET statut = CASE
  WHEN statut IN ('nouveau', 'contacte', 'converti', 'perdu') THEN statut
  WHEN statut = 'en_cours' THEN 'contacte'
  WHEN statut = 'traite' THEN 'converti'
  ELSE 'nouveau'
END;

ALTER TABLE public.contacts
  ALTER COLUMN statut TYPE public.contact_statut USING statut::public.contact_statut;

ALTER TABLE public.contacts
  ALTER COLUMN statut SET DEFAULT 'nouveau'::public.contact_statut;

-- 4) Trigger: annonces agence => en_attente_validation + notif admin
CREATE OR REPLACE FUNCTION public.handle_annonce_insert_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_role public.user_role;
  agence_nom text;
  admin_rec record;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    SELECT u.role INTO creator_role
    FROM public.users u
    WHERE u.id = NEW.created_by;
  END IF;

  IF creator_role = 'agent' THEN
    NEW.statut := 'en_attente_validation';

    SELECT a.nom INTO agence_nom
    FROM public.agences a
    WHERE a.id = NEW.agence_id;

    FOR admin_rec IN
      SELECT u.id
      FROM public.users u
      WHERE u.role = 'admin' AND u.statut = 'actif'
    LOOP
      INSERT INTO public.notifications(user_id, titre, message, type, lien, is_read)
      VALUES (
        admin_rec.id,
        'Annonce a valider',
        'Nouvelle annonce en attente de validation - ' || COALESCE(NEW.titre, 'Sans titre')
          || ' par ' || COALESCE(agence_nom, 'Agence inconnue'),
        'annonce_validation',
        '/admin/annonces?quick=en_attente_validation',
        false
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_annonces_auto_validation ON public.annonces;

CREATE TRIGGER tr_annonces_auto_validation
  BEFORE INSERT ON public.annonces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_annonce_insert_validation();

COMMIT;
