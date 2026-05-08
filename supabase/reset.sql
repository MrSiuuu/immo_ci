-- Suppression du trigger sur auth (schéma toujours présent sous Supabase).
-- Les triggers sur public.annonces / public.alertes sont retirés automatiquement
-- par DROP TABLE ... CASCADE - ne pas les DROP ici : PostgreSQL exige que la
-- table existe pour « DROP TRIGGER … ON table », ce qui casse si la table
-- n’a jamais été créée ou est déjà supprimée.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Suppression des fonctions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.enforce_annonce_quartier_ville();
DROP FUNCTION IF EXISTS public.enforce_alerte_quartier_ville();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.owns_agence(uuid);

-- Suppression explicite des index
DROP INDEX IF EXISTS public.idx_agences_created_at;
DROP INDEX IF EXISTS public.idx_agences_nom;
DROP INDEX IF EXISTS public.photos_one_principale_par_annonce;
DROP INDEX IF EXISTS public.idx_annonces_ville;
DROP INDEX IF EXISTS public.idx_annonces_quartier;
DROP INDEX IF EXISTS public.idx_annonces_type_bien;
DROP INDEX IF EXISTS public.idx_annonces_agence;
DROP INDEX IF EXISTS public.idx_annonces_statut;
DROP INDEX IF EXISTS public.idx_annonces_prix;
DROP INDEX IF EXISTS public.idx_annonces_created_at;
DROP INDEX IF EXISTS public.idx_annonces_transaction;
DROP INDEX IF EXISTS public.idx_photos_annonce;
DROP INDEX IF EXISTS public.idx_vues_annonce;
DROP INDEX IF EXISTS public.idx_vues_user;
DROP INDEX IF EXISTS public.idx_vues_created_at;
DROP INDEX IF EXISTS public.idx_clics_annonce;
DROP INDEX IF EXISTS public.idx_clics_user;
DROP INDEX IF EXISTS public.idx_contacts_agence;
DROP INDEX IF EXISTS public.idx_contacts_annonce;
DROP INDEX IF EXISTS public.idx_contacts_statut;
DROP INDEX IF EXISTS public.idx_favoris_user;
DROP INDEX IF EXISTS public.idx_notifications_user_unread;
DROP INDEX IF EXISTS public.idx_alertes_user;
DROP INDEX IF EXISTS public.idx_boosts_annonce;
DROP INDEX IF EXISTS public.idx_boosts_agence;
DROP INDEX IF EXISTS public.idx_abonnements_agence;
DROP INDEX IF EXISTS public.idx_messages_annonce;
DROP INDEX IF EXISTS public.idx_messages_user;
DROP INDEX IF EXISTS public.idx_logs_user;
DROP INDEX IF EXISTS public.idx_logs_created_at;
DROP INDEX IF EXISTS public.idx_logs_cible;
DROP INDEX IF EXISTS public.idx_logs_details_gin;

-- Suppression des tables (ordre inversé des dépendances)
DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.abonnements CASCADE;
DROP TABLE IF EXISTS public.boosts CASCADE;
DROP TABLE IF EXISTS public.alertes CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.favoris CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.clics CASCADE;
DROP TABLE IF EXISTS public.vues CASCADE;
DROP TABLE IF EXISTS public.photos CASCADE;
DROP TABLE IF EXISTS public.annonces CASCADE;
DROP TABLE IF EXISTS public.agences CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.types_biens CASCADE;
DROP TABLE IF EXISTS public.quartiers CASCADE;
DROP TABLE IF EXISTS public.villes CASCADE;

-- Suppression des types énumérés
DROP TYPE IF EXISTS public.expediteur_type CASCADE;
DROP TYPE IF EXISTS public.abonnement_statut CASCADE;
DROP TYPE IF EXISTS public.abonnement_plan CASCADE;
DROP TYPE IF EXISTS public.boost_statut CASCADE;
DROP TYPE IF EXISTS public.contact_statut CASCADE;
DROP TYPE IF EXISTS public.annonce_statut CASCADE;
DROP TYPE IF EXISTS public.agence_statut CASCADE;
DROP TYPE IF EXISTS public.user_statut CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
