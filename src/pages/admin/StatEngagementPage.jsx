import { useEffect, useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabase'

function keyDay(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function StatEngagementPage() {
  const [vuesRows, setVuesRows] = useState([])
  const [contactsRows, setContactsRows] = useState([])
  const [clicsCount, setClicsCount] = useState(0)
  useEffect(() => {
    ;(async () => {
      const [v, c, cl] = await Promise.all([
        supabase.from('vues').select('created_at'),
        supabase.from('contacts').select('created_at'),
        supabase.from('clics').select('id', { count: 'exact', head: true }),
      ])
      setVuesRows(v.data ?? [])
      setContactsRows(c.data ?? [])
      setClicsCount(cl.count ?? 0)
    })()
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const week = new Date(now)
    week.setDate(now.getDate() - 7)
    const month = new Date(now.getFullYear(), now.getMonth(), 1)
    const totalVues = vuesRows.length
    const totalContacts = contactsRows.length
    return {
      totalVues,
      totalContacts,
      totalClics: clicsCount,
      conversion: totalVues > 0 ? ((totalContacts / totalVues) * 100).toFixed(1) : '0.0',
      today: vuesRows.filter((r) => r.created_at && new Date(r.created_at) >= today).length,
      week: vuesRows.filter((r) => r.created_at && new Date(r.created_at) >= week).length,
      month: vuesRows.filter((r) => r.created_at && new Date(r.created_at) >= month).length,
    }
  }, [vuesRows, contactsRows, clicsCount])

  const daySeries = useMemo(() => {
    const labels = []
    const now = new Date()
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      labels.push(d)
    }
    return labels.map((d) => {
      const kd = keyDay(d)
      const vues = vuesRows.filter((r) => r.created_at && keyDay(new Date(r.created_at)) === kd).length
      const contacts = contactsRows.filter((r) => r.created_at && keyDay(new Date(r.created_at)) === kd).length
      return { jour: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), vues, contacts }
    })
  }, [vuesRows, contactsRows])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Total vues', stats.totalVues],
          ['Total clics contact', stats.totalClics],
          ['Total contacts', stats.totalContacts],
          ['Taux conversion', `${stats.conversion}%`],
          ["Vues aujourd'hui", stats.today],
          ['Vues semaine', stats.week],
          ['Vues mois', stats.month],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#E5E5E5] bg-white p-4">
            <p className="text-xs text-[#666666]">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Évolution des vues (30 jours)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daySeries}>
                <XAxis dataKey="jour" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="vues" stroke="#E02020" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Évolution des contacts (30 jours)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daySeries}>
                <XAxis dataKey="jour" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="contacts" stroke="#111111" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
