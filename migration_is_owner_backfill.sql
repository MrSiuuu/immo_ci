-- Backfill is_owner sur agences existantes
-- Règle: le compte agent le plus ancien de chaque agence devient propriétaire

BEGIN;

-- 1) Remettre tous les agents d'agence à false (idempotent)
UPDATE public.users
SET is_owner = false
WHERE role = 'agent'
  AND agence_id IS NOT NULL;

-- 2) Marquer le plus ancien agent de chaque agence en propriétaire
WITH first_agent_per_agence AS (
  SELECT DISTINCT ON (u.agence_id)
    u.id
  FROM public.users u
  WHERE u.role = 'agent'
    AND u.agence_id IS NOT NULL
  ORDER BY u.agence_id, u.created_at ASC, u.id ASC
)
UPDATE public.users u
SET is_owner = true
FROM first_agent_per_agence f
WHERE u.id = f.id;

COMMIT;
