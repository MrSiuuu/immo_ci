import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Joyride, STATUS } from 'react-joyride'
import { supabase } from '../lib/supabase'

/**
 * Tutoriel première connexion agent (react-joyride).
 * Marque has_seen_tutorial à la fin/fermeture pour un affichage one-shot.
 */
export default function AgentTutorial({ enabled, userId, refreshProfile }) {
  const [run, setRun] = useState(Boolean(enabled && userId))
  const markedOnStartRef = useRef(false)

  const steps = useMemo(
    () => [
      {
        target: '[data-tour="agent-sidebar"]',
        title: 'Bienvenue sur Nestymo',
        content:
          'Voici votre espace professionnel. Tout ce dont vous avez besoin est accessible depuis cette barre latérale.',
        placement: 'right',
      },
      {
        target: '[data-tour="agent-dashboard-stats"]',
        title: 'Vos statistiques',
        content: 'Suivez en temps réel vos annonces publiées, vos brouillons et les contacts reçus.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="agent-nav-annonces"]',
        title: 'Gérez vos annonces',
        content: 'Créez, modifiez et publiez vos biens immobiliers depuis cette section.',
        placement: 'right',
      },
      {
        target: '[data-tour="agent-topbar-new"]',
        title: 'Publiez votre premier bien',
        content: 'Cliquez ici pour créer votre première annonce. Vous pouvez commencer par un brouillon.',
        placement: 'left',
      },
      {
        target: '[data-tour="agent-nav-settings"]',
        title: 'Vos informations',
        content: 'Complétez et mettez à jour les informations de votre agence depuis les paramètres.',
        placement: 'right',
      },
    ],
    [],
  )

  const markSeenTutorial = useCallback(async () => {
    if (!userId) return
    try {
      await supabase.from('users').update({ has_seen_tutorial: true }).eq('id', userId)
    } catch {
      /* ignore */
    }
    await refreshProfile?.()
  }, [userId, refreshProfile])

  useEffect(() => {
    if (!enabled || !userId || !run || markedOnStartRef.current) return
    markedOnStartRef.current = true
    markSeenTutorial()
  }, [enabled, userId, run, markSeenTutorial])

  if (!enabled || !userId) return null

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      showSkipButton
      showProgress
      disableCloseOnEsc={false}
      disableOverlayClose
      locale={{
        back: 'Précédent',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        skip: 'Passer',
      }}
      callback={async (data) => {
        const finished = data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED
        if (!finished) return
        setRun(false)
        await markSeenTutorial()
      }}
      styles={{
        options: {
          arrowColor: '#FFFFFF',
          backgroundColor: '#FFFFFF',
          overlayColor: 'rgba(15, 25, 35, 0.62)',
          primaryColor: '#E02020',
          textColor: '#0F1923',
          zIndex: 1200,
        },
        buttonBack: { color: '#6B7280' },
        buttonClose: { color: '#9CA3AF' },
        buttonNext: { borderRadius: 9999, padding: '8px 16px' },
        buttonSkip: { color: '#6B7280' },
        tooltip: { borderRadius: 16, padding: 8 },
        tooltipTitle: { fontWeight: 700 },
      }}
    />
  )
}
