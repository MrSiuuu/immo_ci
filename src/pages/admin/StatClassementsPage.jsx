import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

function topFromCounts(items, labelMap, n = 5) {
  return [...items.entries()]
    .map(([id, count]) => ({ id, count, label: labelMap.get(id) ?? 'Inconnu' }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

function RankingBlock({ title, items, suffix }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={`${item.id}-${idx}`} className="flex items-center justify-between rounded-lg bg-[#F8F8F8] px-3 py-2 text-sm">
            <span className="truncate">{item.label}</span>
            <strong>{item.count} {suffix}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function StatClassementsPage() {
  const [annonces, setAnnonces] = useState([])
  const [vues, setVues] = useState([])
  const [clics, setClics] = useState([])
  const [contacts, setContacts] = useState([])
  const [agences, setAgences] = useState([])

  useEffect(() => {
    ;(async () => {
      const [a, v, c, ct, g] = await Promise.all([
        supabase.from('annonces').select('id, titre, agence_id, ville_id, photos(url, ordre)').eq('statut', 'publie'),
        supabase.from('vues').select('annonce_id'),
        supabase.from('clics').select('annonce_id'),
        supabase.from('contacts').select('annonce_id, agence_id'),
        supabase.from('agences').select('id, nom, logo_url'),
      ])
      setAnnonces(a.data ?? [])
      setVues(v.data ?? [])
      setClics(c.data ?? [])
      setContacts(ct.data ?? [])
      setAgences(g.data ?? [])
    })()
  }, [])

  const annonceMap = useMemo(() => new Map(annonces.map((a) => [a.id, a.titre ?? 'Annonce'])), [annonces])
  const agenceMap = useMemo(() => new Map(agences.map((a) => [a.id, a.nom ?? 'Agence'])), [agences])

  const topVues = useMemo(() => {
    const m = new Map()
    vues.forEach((x) => x.annonce_id && m.set(x.annonce_id, (m.get(x.annonce_id) ?? 0) + 1))
    return topFromCounts(m, annonceMap)
  }, [vues, annonceMap])
  const topClics = useMemo(() => {
    const m = new Map()
    clics.forEach((x) => x.annonce_id && m.set(x.annonce_id, (m.get(x.annonce_id) ?? 0) + 1))
    return topFromCounts(m, annonceMap)
  }, [clics, annonceMap])
  const topContacts = useMemo(() => {
    const m = new Map()
    contacts.forEach((x) => x.annonce_id && m.set(x.annonce_id, (m.get(x.annonce_id) ?? 0) + 1))
    return topFromCounts(m, annonceMap)
  }, [contacts, annonceMap])
  const topAgencesAnnonces = useMemo(() => {
    const m = new Map()
    annonces.forEach((x) => x.agence_id && m.set(x.agence_id, (m.get(x.agence_id) ?? 0) + 1))
    return topFromCounts(m, agenceMap)
  }, [annonces, agenceMap])

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <RankingBlock title="Top 5 annonces les plus vues" items={topVues} suffix="vues" />
      <RankingBlock title="Top 5 annonces les plus contactées" items={topContacts} suffix="contacts" />
      <RankingBlock title="Top 5 annonces les plus cliquées" items={topClics} suffix="clics" />
      <RankingBlock title="Top 5 agences par annonces publiées" items={topAgencesAnnonces} suffix="annonces" />
    </div>
  )
}
