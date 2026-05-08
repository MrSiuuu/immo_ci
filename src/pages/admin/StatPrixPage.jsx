import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Building2, House, Landmark, Wallet } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function average(values) {
  const arr = values.map((n) => Number(n)).filter((n) => Number.isFinite(n))
  if (!arr.length) return 0
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
}

function avgBy(list, keyGetter) {
  const map = new Map()
  list.forEach((row) => {
    const key = keyGetter(row)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(Number(row.prix))
  })
  return [...map.entries()].map(([name, prices]) => ({ name, prix: average(prices) }))
}

function formatShortFcfa(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0 FCFA'
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace('.', ',')}Md FCFA`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.', ',')}M FCFA`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace('.', ',')}k FCFA`
  return `${Math.round(num)} FCFA`
}

function PriceChartCard({ title, data, color }) {
  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 90, right: 20, top: 10, bottom: 10 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatShortFcfa} />
            <Tooltip
              contentStyle={{ borderRadius: 10, borderColor: '#E5E7EB', fontFamily: 'Inter, sans-serif' }}
              formatter={(v) => `${Number(v).toLocaleString('fr-FR')} FCFA`}
            />
            <Bar dataKey="prix" fill={color} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function StatPrixPage() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('annonces')
        .select('prix, transaction, types_biens(nom), villes(nom)')
        .not('prix', 'is', null)
      setRows(data ?? [])
    })()
  }, [])

  const locationRows = useMemo(() => rows.filter((r) => r.transaction === 'louer'), [rows])
  const venteRows = useMemo(() => rows.filter((r) => r.transaction === 'vendre'), [rows])

  const avgLocation = average(locationRows.map((r) => r.prix))
  const avgVente = average(venteRows.map((r) => r.prix))

  const byTypeLocation = avgBy(locationRows, (r) => r.types_biens?.nom ?? 'Non renseigné')
  const byTypeVente = avgBy(venteRows, (r) => r.types_biens?.nom ?? 'Non renseigné')
  const byVilleLocation = avgBy(locationRows, (r) => r.villes?.nom ?? 'Non renseigné')
  const byVilleVente = avgBy(venteRows, (r) => r.villes?.nom ?? 'Non renseigné')

  return (
    <div className="space-y-6 font-sans">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
          <p className="inline-flex items-center gap-2 text-xs text-[#666666]"><Wallet className="h-4 w-4 text-[#E02020]" /> Prix moyen location</p>
          <p className="mt-1 text-2xl font-semibold">{avgLocation.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
          <p className="inline-flex items-center gap-2 text-xs text-[#666666]"><Landmark className="h-4 w-4 text-[#E02020]" /> Prix moyen vente</p>
          <p className="mt-1 text-2xl font-semibold">{avgVente.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
          <p className="inline-flex items-center gap-2 text-xs text-[#666666]"><House className="h-4 w-4 text-[#E02020]" /> Types location</p>
          <p className="mt-1 text-2xl font-semibold">{byTypeLocation.length}</p>
        </div>
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
          <p className="inline-flex items-center gap-2 text-xs text-[#666666]"><Building2 className="h-4 w-4 text-[#E02020]" /> Communes vente</p>
          <p className="mt-1 text-2xl font-semibold">{byVilleVente.length}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PriceChartCard title="Prix moyen location par type de bien" data={byTypeLocation} color="#E02020" />
        <PriceChartCard title="Prix moyen vente par type de bien" data={byTypeVente} color="#111111" />
        <PriceChartCard title="Prix moyen location par commune" data={byVilleLocation} color="#DC2626" />
        <PriceChartCard title="Prix moyen vente par commune" data={byVilleVente} color="#374151" />
      </div>
    </div>
  )
}
