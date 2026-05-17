-- =============================================================================
-- Olivier Immo - Schéma Supabase (PostgreSQL)
-- Profils liés à auth.users (trigger on_auth_user_created), user_id nullable
-- où convenu, pas d'historique_vues, boosts = source de vérité (pas de is_boosted
-- sur annonces), logs.details en jsonb. Vues/clics : anti-usurpation user_id (RLS).
-- =============================================================================

-- gen_random_uuid() est disponible sans extension en PostgreSQL 13+

-- -----------------------------------------------------------------------------
-- Types énumérés
-- -----------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('user', 'agent', 'admin');
CREATE TYPE public.user_statut AS ENUM ('actif', 'suspendu');
CREATE TYPE public.agence_statut AS ENUM ('active', 'suspendue');
CREATE TYPE public.annonce_statut AS ENUM ('brouillon', 'publie', 'reserve', 'vendu', 'loue');
CREATE TYPE public.contact_statut AS ENUM ('nouveau', 'en_cours', 'traite');
CREATE TYPE public.boost_statut AS ENUM ('actif', 'expire', 'annule');
CREATE TYPE public.abonnement_plan AS ENUM ('starter', 'basique', 'premium', 'pro');
CREATE TYPE public.abonnement_statut AS ENUM ('actif', 'expire', 'annule');
CREATE TYPE public.expediteur_type AS ENUM ('user', 'agence');

-- -----------------------------------------------------------------------------
-- Tables de référence (sans dépendances métier)
-- -----------------------------------------------------------------------------
CREATE TABLE public.villes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT villes_nom_unique UNIQUE (nom)
);

CREATE TABLE public.quartiers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom        text NOT NULL,
  ville_id   uuid NOT NULL REFERENCES public.villes (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quartiers_nom_ville_unique UNIQUE (nom, ville_id)
);

CREATE TABLE public.types_biens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT types_biens_nom_unique UNIQUE (nom)
);

-- Seed des types de biens standards du dashboard
INSERT INTO public.types_biens (nom) VALUES
  ('Appartement'),
  ('Villa'),
  ('Duplex'),
  ('Studio'),
  ('Chambre'),
  ('Immeuble'),
  ('Local commercial'),
  ('Terrain')
ON CONFLICT (nom) DO NOTHING;

CREATE TABLE public.agences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         text NOT NULL,
  description text,
  logo        text,
  logo_url    text,
  adresse     text,
  ville       text,
  ville_id    uuid REFERENCES public.villes (id) ON DELETE SET NULL,
  quartier    text,
  telephone   text,
  whatsapp    text,
  email       text,
  show_phone  boolean NOT NULL DEFAULT true,
  show_email  boolean NOT NULL DEFAULT true,
  show_whatsapp boolean NOT NULL DEFAULT true,
  site_web    text,
  statut      public.agence_statut NOT NULL DEFAULT 'active',
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  numero_agrement_mclu text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Profil applicatif : même UUID que auth.users
CREATE TABLE public.users (
  id         uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email      text NOT NULL,
  nom        text,
  prenom     text,
  telephone  text,
  initiales  text,
  role       public.user_role NOT NULL DEFAULT 'user',
  is_owner   boolean NOT NULL DEFAULT false,
  statut     public.user_statut NOT NULL DEFAULT 'actif',
  agence_id  uuid REFERENCES public.agences(id) ON DELETE SET NULL,
  must_change_password boolean NOT NULL DEFAULT false,
  has_seen_tutorial boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen  timestamptz,
  CONSTRAINT users_email_unique UNIQUE (email)
);

ALTER TABLE public.agences
  ADD COLUMN created_by uuid REFERENCES public.users (id) ON DELETE SET NULL;

CREATE TABLE public.annonces (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre            text NOT NULL,
  description      text,
  type_bien_id     uuid NOT NULL REFERENCES public.types_biens (id) ON DELETE RESTRICT,
  prix             numeric(14, 2) NOT NULL CHECK (prix >= 0),
  surface          numeric(12, 2) CHECK (surface IS NULL OR surface >= 0),
  chambres         smallint CHECK (chambres IS NULL OR chambres >= 0),
  salles_de_bain   smallint CHECK (salles_de_bain IS NULL OR salles_de_bain >= 0),
  ville_id         uuid NOT NULL REFERENCES public.villes (id) ON DELETE RESTRICT,
  quartier_id      uuid REFERENCES public.quartiers (id) ON DELETE SET NULL,
  adresse          text,
  latitude         double precision,
  longitude        double precision,
  statut           public.annonce_statut NOT NULL DEFAULT 'brouillon',
  agence_id        uuid NOT NULL REFERENCES public.agences (id) ON DELETE CASCADE,
  created_by       uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  "transaction"    text CHECK ("transaction" IN ('louer', 'vendre', 'bail')),
  equipements      jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.photos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id     uuid NOT NULL REFERENCES public.annonces (id) ON DELETE CASCADE,
  url            text NOT NULL,
  ordre          int NOT NULL DEFAULT 0 CHECK (ordre >= 0),
  is_principale  boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vues (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id uuid NOT NULL REFERENCES public.annonces (id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clics (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id uuid NOT NULL REFERENCES public.annonces (id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contacts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id uuid NOT NULL REFERENCES public.annonces (id) ON DELETE CASCADE,
  agence_id  uuid NOT NULL REFERENCES public.agences (id) ON DELETE CASCADE,
  user_id    uuid REFERENCES public.users (id) ON DELETE SET NULL,
  nom        text NOT NULL,
  email      text NOT NULL,
  telephone  text,
  message    text NOT NULL,
  statut     public.contact_statut NOT NULL DEFAULT 'nouveau',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.favoris (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  annonce_id uuid NOT NULL REFERENCES public.annonces (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favoris_user_annonce_unique UNIQUE (user_id, annonce_id)
);

CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  titre      text NOT NULL,
  message    text NOT NULL,
  type       text NOT NULL,
  is_read    boolean NOT NULL DEFAULT false,
  lien       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.alertes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  ville_id      uuid REFERENCES public.villes (id) ON DELETE CASCADE,
  quartier_id   uuid REFERENCES public.quartiers (id) ON DELETE CASCADE,
  type_bien_id  uuid REFERENCES public.types_biens (id) ON DELETE SET NULL,
  prix_min      numeric(14, 2) CHECK (prix_min IS NULL OR prix_min >= 0),
  prix_max      numeric(14, 2) CHECK (prix_max IS NULL OR prix_max >= 0),
  chambres_min  smallint CHECK (chambres_min IS NULL OR chambres_min >= 0),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT alertes_prix_coherent CHECK (
    prix_min IS NULL OR prix_max IS NULL OR prix_min <= prix_max
  )
);

CREATE TABLE public.boosts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annonce_id  uuid NOT NULL REFERENCES public.annonces (id) ON DELETE CASCADE,
  agence_id   uuid NOT NULL REFERENCES public.agences (id) ON DELETE CASCADE,
  prix        numeric(14, 2) NOT NULL CHECK (prix >= 0),
  duree       interval NOT NULL,
  date_debut  timestamptz NOT NULL,
  date_fin    timestamptz NOT NULL,
  statut      public.boost_statut NOT NULL DEFAULT 'actif',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT boosts_dates_coherentes CHECK (date_fin > date_debut)
);

CREATE TABLE public.abonnements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agence_id   uuid NOT NULL REFERENCES public.agences (id) ON DELETE CASCADE,
  plan        public.abonnement_plan NOT NULL,
  prix        numeric(14, 2) NOT NULL CHECK (prix >= 0),
  date_debut  timestamptz NOT NULL,
  date_fin    timestamptz NOT NULL,
  statut      public.abonnement_statut NOT NULL DEFAULT 'actif',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT abonnements_dates_coherentes CHECK (date_fin > date_debut)
);

CREATE TABLE public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users (id) ON DELETE SET NULL,
  agence_id   uuid NOT NULL REFERENCES public.agences (id) ON DELETE CASCADE,
  annonce_id  uuid NOT NULL REFERENCES public.annonces (id) ON DELETE CASCADE,
  contenu     text NOT NULL,
  is_read     boolean NOT NULL DEFAULT false,
  expediteur  public.expediteur_type NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users (id) ON DELETE SET NULL,
  action      text NOT NULL,
  cible_type  text NOT NULL,
  cible_id    uuid,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Trigger updated_at sur annonces
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Validation quartier ⊆ ville (CHECK ne peut pas référencer d'autres tables en PG)
CREATE OR REPLACE FUNCTION public.enforce_annonce_quartier_ville()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quartier_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.quartiers q
      WHERE q.id = NEW.quartier_id AND q.ville_id = NEW.ville_id
    ) THEN
      RAISE EXCEPTION 'quartier_id doit correspondre à ville_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_alerte_quartier_ville()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quartier_id IS NOT NULL THEN
    IF NEW.ville_id IS NULL THEN
      RAISE EXCEPTION 'ville_id requis lorsque quartier_id est renseigné';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.quartiers q
      WHERE q.id = NEW.quartier_id AND q.ville_id = NEW.ville_id
    ) THEN
      RAISE EXCEPTION 'quartier_id doit appartenir à ville_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_annonces_updated_at
  BEFORE UPDATE ON public.annonces
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_annonces_quartier_ville
  BEFORE INSERT OR UPDATE ON public.annonces
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_annonce_quartier_ville();

CREATE TRIGGER tr_alertes_quartier_ville
  BEFORE INSERT OR UPDATE ON public.alertes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_alerte_quartier_ville();

-- -----------------------------------------------------------------------------
-- Profil public.users à chaque inscription Supabase Auth
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.email), ''), NEW.id::text || '@pending.local')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Au plus une photo principale par annonce (optionnel mais utile côté UI)
CREATE UNIQUE INDEX photos_one_principale_par_annonce
  ON public.photos (annonce_id)
  WHERE is_principale = true;

-- -----------------------------------------------------------------------------
-- Index de recherche / jointures fréquentes
-- -----------------------------------------------------------------------------
CREATE INDEX idx_annonces_ville ON public.annonces (ville_id);
CREATE INDEX idx_annonces_quartier ON public.annonces (quartier_id);
CREATE INDEX idx_annonces_type_bien ON public.annonces (type_bien_id);
CREATE INDEX idx_annonces_agence ON public.annonces (agence_id);
CREATE INDEX idx_annonces_statut ON public.annonces (statut);
CREATE INDEX idx_annonces_prix ON public.annonces (prix);
CREATE INDEX idx_annonces_created_at ON public.annonces (created_at DESC);
CREATE INDEX idx_annonces_transaction ON public.annonces ("transaction");

CREATE INDEX idx_photos_annonce ON public.photos (annonce_id);
CREATE INDEX idx_vues_annonce ON public.vues (annonce_id);
CREATE INDEX idx_vues_user ON public.vues (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_vues_created_at ON public.vues (created_at DESC);

CREATE INDEX idx_clics_annonce ON public.clics (annonce_id);
CREATE INDEX idx_clics_user ON public.clics (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX idx_contacts_agence ON public.contacts (agence_id);
CREATE INDEX idx_contacts_annonce ON public.contacts (annonce_id);
CREATE INDEX idx_contacts_statut ON public.contacts (statut);

CREATE INDEX idx_favoris_user ON public.favoris (user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read);

CREATE INDEX idx_alertes_user ON public.alertes (user_id);
CREATE INDEX idx_boosts_annonce ON public.boosts (annonce_id);
CREATE INDEX idx_boosts_agence ON public.boosts (agence_id);
CREATE INDEX idx_abonnements_agence ON public.abonnements (agence_id);

CREATE INDEX idx_messages_annonce ON public.messages (annonce_id);
CREATE INDEX idx_messages_user ON public.messages (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX idx_logs_user ON public.logs (user_id);
CREATE INDEX idx_logs_created_at ON public.logs (created_at DESC);
CREATE INDEX idx_logs_cible ON public.logs (cible_type, cible_id);

-- Index pour pagination et recherche des agences
CREATE INDEX IF NOT EXISTS idx_agences_created_at
  ON public.agences (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agences_nom
  ON public.agences USING gin (to_tsvector('simple', nom));

-- JSONB : index GIN optionnel si filtrage fréquent sur clés
CREATE INDEX idx_logs_details_gin ON public.logs USING gin (details);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.villes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quartiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.types_biens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Helpers : rôle admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin' AND u.statut = 'actif'
  );
$$;

-- Qui peut gérer une agence (créateur ou agent lié via users.agence_id)
CREATE OR REPLACE FUNCTION public.owns_agence(aid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agences g
    LEFT JOIN public.users u ON u.id = auth.uid()
    WHERE g.id = aid
      AND (
        g.created_by = auth.uid()
        OR u.agence_id = g.id
      )
  );
$$;

-- Villes / quartiers / types : lecture publique, écriture admin
CREATE POLICY villes_select_all ON public.villes FOR SELECT USING (true);
CREATE POLICY villes_write_admin ON public.villes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY quartiers_select_all ON public.quartiers FOR SELECT USING (true);
CREATE POLICY quartiers_write_admin ON public.quartiers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY types_biens_select_all ON public.types_biens FOR SELECT USING (true);
CREATE POLICY types_biens_write_admin ON public.types_biens FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Users : lecture pour utilisateurs authentifiés (annuaire basique) ; écriture sur son profil
CREATE POLICY users_select_auth ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY users_insert_own ON public.users FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Agences
CREATE POLICY agences_select_active_or_own ON public.agences
FOR SELECT
USING (
  statut = 'active'
  OR public.owns_agence(id)
  OR public.is_admin()
);
CREATE POLICY agences_insert_auth ON public.agences FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY agences_update_owner ON public.agences FOR UPDATE USING (
  created_by = auth.uid() OR public.is_admin()
) WITH CHECK (created_by = auth.uid() OR public.is_admin());

-- Annonces : lecture des publiées pour tous ; brouillons / autres statuts pour propriétaire agence ou admin
CREATE POLICY annonces_select ON public.annonces FOR SELECT USING (
  statut = 'publie'
  OR public.owns_agence(agence_id)
  OR public.is_admin()
);
CREATE POLICY annonces_insert ON public.annonces FOR INSERT TO authenticated WITH CHECK (
  public.owns_agence(agence_id) OR public.is_admin()
);
CREATE POLICY annonces_update ON public.annonces FOR UPDATE USING (
  public.owns_agence(agence_id) OR public.is_admin()
) WITH CHECK (
  public.owns_agence(agence_id) OR public.is_admin()
);
CREATE POLICY annonces_delete ON public.annonces FOR DELETE USING (
  public.owns_agence(agence_id) OR public.is_admin()
);

-- Photos : même périmètre que l'annonce liée
CREATE POLICY photos_select ON public.photos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.annonces a
    WHERE a.id = photos.annonce_id AND (
      a.statut = 'publie' OR public.owns_agence(a.agence_id) OR public.is_admin()
    )
  )
);
CREATE POLICY photos_write ON public.photos FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.annonces a
    WHERE a.id = photos.annonce_id AND (public.owns_agence(a.agence_id) OR public.is_admin())
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.annonces a
    WHERE a.id = photos.annonce_id AND (public.owns_agence(a.agence_id) OR public.is_admin())
  )
);

-- Vues / clics : anonyme → user_id NULL ; connecté → user_id = auth.uid() (pas d'usurpation)
CREATE POLICY vues_insert_scoped ON public.vues FOR INSERT WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);
CREATE POLICY vues_select ON public.vues FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.annonces a
    WHERE a.id = vues.annonce_id AND public.owns_agence(a.agence_id)
  )
);

CREATE POLICY clics_insert_scoped ON public.clics FOR INSERT WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);
CREATE POLICY clics_select ON public.clics FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.annonces a
    WHERE a.id = clics.annonce_id AND public.owns_agence(a.agence_id)
  )
);

-- Contacts : tout le monde peut envoyer ; agence voit les siennes
CREATE POLICY contacts_insert ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY contacts_select ON public.contacts FOR SELECT USING (
  public.owns_agence(agence_id) OR public.is_admin()
);
CREATE POLICY contacts_update ON public.contacts FOR UPDATE USING (
  public.owns_agence(agence_id) OR public.is_admin()
) WITH CHECK (
  public.owns_agence(agence_id) OR public.is_admin()
);

-- Favoris
CREATE POLICY favoris_own ON public.favoris FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notifications
CREATE POLICY notifications_own ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Alertes
CREATE POLICY alertes_own ON public.alertes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Boosts / abonnements : agence propriétaire ou admin
CREATE POLICY boosts_select ON public.boosts FOR SELECT USING (
  public.owns_agence(agence_id) OR public.is_admin()
);
CREATE POLICY boosts_write ON public.boosts FOR ALL TO authenticated USING (
  public.owns_agence(agence_id) OR public.is_admin()
) WITH CHECK (
  public.owns_agence(agence_id) OR public.is_admin()
);

CREATE POLICY abonnements_select ON public.abonnements FOR SELECT USING (
  public.owns_agence(agence_id) OR public.is_admin()
);
CREATE POLICY abonnements_write ON public.abonnements FOR ALL TO authenticated USING (
  public.owns_agence(agence_id) OR public.is_admin()
) WITH CHECK (
  public.owns_agence(agence_id) OR public.is_admin()
);

-- Messages : utilisateur concerné ou agence propriétaire
CREATE POLICY messages_select ON public.messages FOR SELECT USING (
  user_id = auth.uid()
  OR public.owns_agence(agence_id)
  OR public.is_admin()
);
CREATE POLICY messages_insert ON public.messages FOR INSERT TO authenticated WITH CHECK (
  public.is_admin()
  OR (
    expediteur = 'user'
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.annonces a
      WHERE a.id = messages.annonce_id AND a.agence_id = messages.agence_id
    )
  )
  OR (
    expediteur = 'agence'
    AND public.owns_agence(agence_id)
    AND user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.annonces a
      WHERE a.id = messages.annonce_id AND a.agence_id = messages.agence_id
    )
  )
);
CREATE POLICY messages_update ON public.messages FOR UPDATE USING (
  user_id = auth.uid() OR public.owns_agence(agence_id) OR public.is_admin()
) WITH CHECK (
  user_id = auth.uid() OR public.owns_agence(agence_id) OR public.is_admin()
);

-- Logs : son propre journal ou admin
CREATE POLICY logs_select ON public.logs FOR SELECT USING (
  user_id = auth.uid() OR public.is_admin()
);
CREATE POLICY logs_insert ON public.logs FOR INSERT TO authenticated WITH CHECK (
  user_id IS NULL OR user_id = auth.uid() OR public.is_admin()
);

-- =============================================================================
-- Optionnel : enrichir handle_new_user() avec raw_user_meta_data (nom, prénom)
-- depuis auth.users, ou webhook Edge si tu préfères ne pas toucher à auth.
--
-- Mise à jour depuis une ancienne version du script : si les politiques
-- vues_insert_all / clics_insert_all existent encore, exécuter :
--   DROP POLICY IF EXISTS vues_insert_all ON public.vues;
--   DROP POLICY IF EXISTS clics_insert_all ON public.clics;
-- =============================================================================