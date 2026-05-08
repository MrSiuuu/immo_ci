import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabase'

const PIE_COLORS = ['#E02020', '#111111', '#F59E0B', '#10B981', '#6366F1', '#EC4899']

export default function StatAnnoncesPage() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('annonces').select('statut, transaction, created_at, types_biens(nom)')
      setRows(data ?? [])
    })()
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startWeek = new Date(now)
    startWeek.setDate(now.getDate() - 7)
    return {
      total: rows.length,
      publie: rows.filter((r) => r.statut === 'publie').length,
      brouillon: rows.filter((r) => r.statut === 'brouillon').length,
      reserve: rows.filter((r) => r.statut === 'reserve').length,
      vendu: rows.filter((r) => r.statut === 'vendu').length,
      loue: rows.filter((r) => r.statut === 'loue').length,
      mois: rows.filter((r) => r.created_at && new Date(r.created_at) >= startMonth).length,
      semaine: rows.filter((r) => r.created_at && new Date(r.created_at) >= startWeek).length,
    }
  }, [rows])

  const byType = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => {
      const label = r.types_biens?.nom ?? 'Non renseigné'
      map.set(label, (map.get(label) ?? 0) + 1)
    })
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [rows])

  const byTransaction = useMemo(() => {
    const labels = { vendre: 'Vente', louer: 'Location', bail: 'Bail' }
    const map = new Map()
    rows.forEach((r) => {
      const label = labels[r.transaction] ?? (r.transaction || 'Autre')
      map.set(label, (map.get(label) ?? 0) + 1)
    })
    return [...map.entries()].map(([name, total]) => ({ name, total }))
  }, [rows])

  const cards = [
    ['Total annonces', stats.total],
    ['Publiées', stats.publie],
    ['Brouillon', stats.brouillon],
    ['Réservées', stats.reserve],
    ['Vendues', stats.vendu],
    ['Louées', stats.loue],
    ['Ajoutées ce mois', stats.mois],
    ['Ajoutées cette semaine', stats.semaine],
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#E5E5E5] bg-white p-4">
            <p className="text-xs text-[#666666]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#111111]">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Répartition par type de bien</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" outerRadius={100} innerRadius={62}>
                  {byType.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Répartition Vente vs Location</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTransaction}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="#E02020" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
