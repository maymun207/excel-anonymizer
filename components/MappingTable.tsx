'use client'

interface MappingTableProps {
  mapping: Record<string, string>
}

export default function MappingTable({ mapping }: MappingTableProps) {
  const entries = Object.entries(mapping)

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Maskeleme Haritası</span>
        <span className="text-xs text-gray-500">{entries.length} kayıt</span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">Orijinal</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 border-b border-gray-100">Etiket</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([original, label]) => (
              <tr key={original} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-700 truncate max-w-[200px]" title={original}>{original}</td>
                <td className="px-4 py-2 font-mono text-blue-700">{label}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-4 text-center text-gray-400">
                  Henüz maskeleme haritası yok
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
