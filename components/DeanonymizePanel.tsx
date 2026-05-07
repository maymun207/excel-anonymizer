'use client'

import type { useDeanonymizer } from '@/hooks/useAnonymizer'

type Props = ReturnType<typeof useDeanonymizer>

export default function DeanonymizePanel(props: Props) {
  const {
    deanonBuffer,
    deanonFilename,
    deanonMapData,
    deanonDone,
    handleDeanonFile,
    handleDeanonMap,
    handleDeanonymize,
    resetDeanon,
  } = props

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-xl shadow-black/20">
      {!deanonDone ? (
        <div className="flex flex-col gap-5">
          <h2 className="text-base font-semibold text-zinc-200">
            Maskelemeyi Geri Al
          </h2>

          <div>
            <p className="text-sm font-medium text-zinc-400 mb-2">
              Adım 1 — Anonim Excel dosyasını seç
            </p>
            <label
              className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150
                ${
                  deanonBuffer
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-zinc-700 bg-zinc-800/30 hover:border-blue-500/50 hover:bg-blue-500/5'
                }`}
            >
              <svg
                className={`w-5 h-5 flex-shrink-0 ${deanonBuffer ? 'text-green-400' : 'text-zinc-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"
                />
              </svg>
              <span
                className={`text-sm ${deanonBuffer ? 'text-green-400' : 'text-zinc-500'}`}
              >
                {deanonBuffer
                  ? `✓ ${deanonFilename}`
                  : 'anon_*.xlsx dosyasını seç'}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleDeanonFile(f)
                }}
              />
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-400 mb-2">
              Adım 2 — Mapping JSON dosyasını seç
            </p>
            <label
              className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150
                ${
                  deanonMapData
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-zinc-700 bg-zinc-800/30 hover:border-blue-500/50 hover:bg-blue-500/5'
                }`}
            >
              <svg
                className={`w-5 h-5 flex-shrink-0 ${deanonMapData ? 'text-green-400' : 'text-zinc-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                />
              </svg>
              <span
                className={`text-sm ${deanonMapData ? 'text-green-400' : 'text-zinc-500'}`}
              >
                {deanonMapData
                  ? `✓ ${deanonMapData.originalFile} — ${Object.keys(deanonMapData.mapping).length} kayıt`
                  : 'mapping_*.json dosyasını seç'}
              </span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleDeanonMap(f)
                }}
              />
            </label>
          </div>

          <button
            onClick={handleDeanonymize}
            disabled={!deanonBuffer || !deanonMapData}
            className="self-start px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-blue-600/20"
          >
            🔓 Geri Yükle & İndir
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 p-8 bg-green-500/5 border border-green-500/20 rounded-2xl">
          <span className="text-5xl">✅</span>
          <h2 className="text-lg font-semibold text-green-400">
            Geri yükleme tamamlandı!
          </h2>
          <p className="text-sm text-zinc-400">
            restored_{deanonFilename} indirildi.
          </p>
          <button
            onClick={resetDeanon}
            className="px-5 py-2 text-sm font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:text-white transition-all duration-150"
          >
            ↩ Yeni Dosya
          </button>
        </div>
      )}
    </div>
  )
}
