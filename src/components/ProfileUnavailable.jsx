import { useUser } from '../hooks/useUser'

/**
 * Affiché lorsque la session existe mais le profil (rôle) n’a pas pu être chargé.
 * Évite une boucle de redirections entre /admin et /agence.
 */
export default function ProfileUnavailable() {
  const { refreshProfile } = useUser()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#FAF6EF] px-6 text-center dark:bg-slate-950">
      <div>
        <h1 className="text-lg font-semibold text-[#0F1923] dark:text-white">Profil indisponible</h1>
        <p className="mt-2 max-w-md text-sm text-[#0F1923]/70 dark:text-slate-300">
          Impossible de charger votre rôle depuis le serveur. Vérifiez votre connexion ou que la base est à jour,
          puis réessayez.
        </p>
      </div>
      <button
        type="button"
        onClick={() => refreshProfile()}
        className="rounded-lg bg-[#D97B00] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#c26f00]"
      >
        Réessayer
      </button>
    </div>
  )
}
