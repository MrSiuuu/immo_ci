import { useEffect, useState } from 'react'
import { BarChart2, Building2, DollarSign, FileText, TrendingUp, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const CARDS = [
  { to: '/admin/statistiques/annonces', label: 'Annonces', icon: FileText },
  { to: '/admin/statistiques/agences', label: 'Agences', icon: Building2 },
  { to: '/admin/statistiques/engagement', label: 'Engagement', icon: TrendingUp },
  { to: '/admin/statistiques/prix', label: 'Prix', icon: DollarSign },
  { to: '/admin/statistiques/classements', label: 'Classements', icon: Trophy },
  { to: '/admin/statistiques/tendances', label: 'Tendances', icon: BarChart2 },
]

export default function StatistiquesPage() {
  const [stats, setStats] = useState({ annonces: 0, agences: 0, vuesMois: 0, prixVente: 0, prixLocation: 0 })
  useEffect(() => {
    ;(async () => {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const [a, g, v, vente, location] = await Promise.all([
        supabase.from('annonces').select('id', { count: 'exact', head: true }).eq('statut', 'publie'),
        supabase.from('agences').select('id', { count: 'exact', head: true }).eq('statut', 'active'),
        supabase.from('vues').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
        supabase.from('annonces').select('prix').eq('transaction', 'vendre').not('prix', 'is', null),
        supabase.from('annonces').select('prix').eq('transaction', 'louer').not('prix', 'is', null),
      ])
      const avg = (rows) => {
        const arr = (rows ?? []).map((r) => Number(r.prix)).filter((n) => Number.isFinite(n))
        if (arr.length === 0) return 0
        return Math.round(arr.reduce((s, n) => s + n, 0) / arr.length)
      }
      setStats({
        annonces: a.count ?? 0,
        agences: g.count ?? 0,
        vuesMois: v.count ?? 0,
        prixVente: avg(vente.data),
        prixLocation: avg(location.data),
      })
    })()
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {CARDS.map((c) => {
        const Icon = c.icon
        const val =
          c.label === 'Annonces'
            ? stats.annonces
            : c.label === 'Agences'
              ? stats.agences
              : c.label === 'Engagement'
                ? stats.vuesMois
                : c.label === 'Prix'
                  ? `${stats.prixLocation.toLocaleString('fr-FR')} / ${stats.prixVente.toLocaleString('fr-FR')} FCFA`
                  : c.label === 'Classements'
                    ? 'Top 5 annonces'
                    : '30 jours'
        return (
          <Link key={c.to} to={c.to} className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#E02020] hover:shadow-md">
            <div className="mb-3 inline-flex rounded-lg bg-[#F8F8F8] p-2 text-[#E02020]"><Icon className="h-5 w-5" /></div>
            <p className="text-sm text-[#666666]">{c.label}</p>
            <p className="mt-1 text-3xl font-semibold text-[#111111]">{val}</p>
          </Link>
        )
      })}
    </div>
  )
}
