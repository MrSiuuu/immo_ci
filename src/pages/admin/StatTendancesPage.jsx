import { useEffect, useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabase'

const PERIODS = [
  { key: '7d', label: '7j', days: 7 },
  { key: '30d', label: '30j', days: 30 },
  { key: '3m', label: '3 mois', days: 90 },
  { key: '6m', label: '6 mois', days: 180 },
  { key: '12m', label: '12 mois', days: 365 },
]

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function TrendChartCard({ title, keyName, color, trendData }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <XAxis dataKey="label" minTickGap={24} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey={keyName} stroke={color} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function StatTendancesPage() {
  const [period, setPeriod] = useState('30d')
  const [annonces, setAnnonces] = useState([])
  const [agences, setAgences] = useState([])
  const [vues, setVues] = useState([])
  const [contacts, setContacts] = useState([])

  useEffect(() => {
    ;(async () => {
      const [a, g, v, c] = await Promise.all([
        supabase.from('annonces').select('created_at'),
        supabase.from('agences').select('created_at'),
        supabase.from('vues').select('created_at'),
        supabase.from('contacts').select('created_at'),
      ])
      setAnnonces(a.data ?? [])
      setAgences(g.data ?? [])
      setVues(v.data ?? [])
      setContacts(c.data ?? [])
    })()
  }, [])

  const trendData = useMemo(() => {
    const cfg = PERIODS.find((p) => p.key === period) ?? PERIODS[1]
    const now = new Date()
    const points = []
    for (let i = cfg.days - 1; i >= 0; i -= 1) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = dayKey(d)
      points.push({
        label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        annonces: annonces.filter((x) => x.created_at && dayKey(new Date(x.created_at)) === key).length,
        agences: agences.filter((x) => x.created_at && dayKey(new Date(x.created_at)) === key).length,
        vues: vues.filter((x) => x.created_at && dayKey(new Date(x.created_at)) === key).length,
        contacts: contacts.filter((x) => x.created_at && dayKey(new Date(x.created_at)) === key).length,
      })
    }
    return points
  }, [period, annonces, agences, vues, contacts])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`rounded-full px-3 py-1.5 text-sm ${period === p.key ? 'bg-[#E02020] text-white' : 'border border-[#E5E5E5] bg-white text-[#111111]'}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TrendChartCard title="Évolution annonces créées" keyName="annonces" color="#E02020" trendData={trendData} />
        <TrendChartCard title="Évolution agences" keyName="agences" color="#111111" trendData={trendData} />
        <TrendChartCard title="Évolution vues" keyName="vues" color="#DC2626" trendData={trendData} />
        <TrendChartCard title="Évolution contacts" keyName="contacts" color="#374151" trendData={trendData} />
      </div>
    </div>
  )
}
