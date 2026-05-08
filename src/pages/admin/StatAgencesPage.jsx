import { useEffect, useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabase'

export default function StatAgencesPage() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from('agences').select('statut, verification_status, created_at')
      setRows(data ?? [])
    })()
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
      total: rows.length,
      active: rows.filter((r) => r.statut === 'active').length,
      suspendue: rows.filter((r) => r.statut === 'suspendue').length,
      attente: rows.filter((r) => r.verification_status === 'pending').length,
      month: rows.filter((r) => r.created_at && new Date(r.created_at) >= startMonth).length,
    }
  }, [rows])

  const lineData = useMemo(() => {
    const out = []
    const now = new Date()
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const count = rows.filter((r) => {
        if (!r.created_at) return false
        const x = new Date(r.created_at)
        const k = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`
        return k === key
      }).length
      out.push({ mois: d.toLocaleDateString('fr-FR', { month: 'short' }), total: count })
    }
    return out
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Total', stats.total],
          ['Actives', stats.active],
          ['Suspendues', stats.suspendue],
          ['En attente', stats.attente],
          ['Ajoutées ce mois', stats.month],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#E5E5E5] bg-white p-4">
            <p className="text-xs text-[#666666]">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Évolution des agences (6 mois)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey="mois" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#E02020" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
