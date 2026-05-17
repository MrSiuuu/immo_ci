-- Migration Nestymo Corrections V3 (CDC)
-- A executer manuellement dans Supabase SQL Editor.
-- Note : sur certains plans Supabase, activer l extension pg_cron depuis le tableau de bord si CREATE EXTENSION echoue.

-- 0) Extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1) Realtime : publier les changements sur notifications (cloche admin sans rechargement)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 2) Validation automatique : annonces en attente depuis plus de 24 h -> publie + notifications agents
CREATE OR REPLACE FUNCTION public.nestymo_auto_publish_annonces_24h()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer := 0;
BEGIN
  WITH updated AS (
    UPDATE public.annonces a
    SET
      statut = 'publie'::public.annonce_statut,
      updated_at = now()
    WHERE a.statut = 'en_attente_validation'::public.annonce_statut
      AND a.created_at < (now() - interval '24 hours')
    RETURNING a.id, a.agence_id, a.titre
  ),
  ins AS (
    INSERT INTO public.notifications (user_id, titre, message, type, lien, is_read)
    SELECT
      u.id,
      'Annonce publiee automatiquement',
      'Votre annonce "' || COALESCE(upd.titre, 'Sans titre') || '" a ete publiee automatiquement apres 24 h en attente.',
      'annonce_auto_publiee',
      '/agence/annonces/' || upd.id::text,
      false
    FROM updated upd
    INNER JOIN public.users u
      ON u.agence_id = upd.agence_id
      AND u.role = 'agent'::public.user_role
      AND u.statut = 'actif'::public.user_statut
    RETURNING 1
  )
  SELECT count(*)::integer INTO n FROM ins;

  RETURN coalesce(n, 0);
END;
$$;

COMMENT ON FUNCTION public.nestymo_auto_publish_annonces_24h() IS
  'Passe en publie les annonces en_attente_validation depuis plus de 24 h et notifie les agents de l agence.';

-- 3) Planification : toutes les heures (supprime l ancien job si present)
DO $$
DECLARE
  r record;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    FOR r IN (SELECT jobid FROM cron.job WHERE jobname = 'nestymo_auto_publish_24h')
    LOOP
      PERFORM cron.unschedule(r.jobid);
    END LOOP;
  END IF;
END $$;

SELECT cron.schedule(
  'nestymo_auto_publish_24h',
  '0 * * * *',
  $$SELECT public.nestymo_auto_publish_annonces_24h();$$
);
