-- Migration Nestymo V3
-- Corrections RLS: notifications + agences
-- A executer manuellement dans Supabase SQL Editor

BEGIN;

-- 1) Notifications: autoriser les admins a inserer pour n'importe quel user_id
DROP POLICY IF EXISTS notifications_admin_insert ON public.notifications;

CREATE POLICY notifications_admin_insert
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- 2) Agences: permettre a un agent owner d'agence de mettre a jour sa propre ligne
DROP POLICY IF EXISTS agences_update_owner ON public.agences;

CREATE POLICY agences_update_owner
ON public.agences
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR id IN (
    SELECT u.agence_id
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'agent'
      AND u.agence_id IS NOT NULL
  )
)
WITH CHECK (
  public.is_admin()
  OR id IN (
    SELECT u.agence_id
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'agent'
      AND u.agence_id IS NOT NULL
  )
);

COMMIT;
