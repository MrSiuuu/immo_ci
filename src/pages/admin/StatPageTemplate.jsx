import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function StatPageTemplate({ title, loader }) {
  const [data, setData] = useState([])
  useEffect(() => {
    ;(async () => {
      const rows = await loader(supabase)
      setData(rows ?? [])
    })()
  }, [loader])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#111111]">{title}</h2>
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-4">
        {data.length === 0 ? (
          <p className="text-sm text-[#666666]">Aucune donnée.</p>
        ) : (
          <ul className="space-y-2">
            {data.map((row, idx) => (
              <li key={idx} className="flex items-center justify-between rounded-lg bg-[#F8F8F8] px-3 py-2 text-sm">
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
