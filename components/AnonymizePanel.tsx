'use client'

import DropZone from '@/components/DropZone'
import SheetTabs from '@/components/SheetTabs'
import ColumnTable from '@/components/ColumnTable'
import MappingTable from '@/components/MappingTable'
import type { useAnonymizer } from '@/hooks/useAnonymizer'

type Props = ReturnType<typeof useAnonymizer>

export default function AnonymizePanel(props: Props) {
  const {
    step,
    filename,
    sheetNames,
    activeSheet,
    setActiveSheet,
    columnConfig,
    mapping,
    aiLoading,
    aiAllLoading,
    aiAllProgress,
    aiSuggested,
    processing,
    isBusy,
    taggedCount,
    headers,
    previewRows,
    handleFile,
    handleAiScan,
    handleAiScanAll,
    handleAnonymize,
    handleToggle,
    resetAll,
  } = props

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-xl shadow-black/20">
      {step === 'upload' && <DropZone onFile={handleFile} />}

      {step === 'configure' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3.5 h-3.5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-medium text-zinc-200">{filename}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500">{sheetNames.length} sayfa</span>
            </div>
            <div className="flex gap-2">
              {sheetNames.length > 1 && (
                <button
                  onClick={handleAiScanAll}
                  disabled={isBusy}
                  className="px-3 py-1.5 text-sm font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 disabled:opacity-40 transition-all duration-150"
                >
                  {aiAllLoading
                    ? `⏳ ${aiAllProgress}`
                    : '🚀 AI Tüm Tablar'}
                </button>
              )}
              <button
                onClick={handleAiScan}
                disabled={isBusy}
                className="px-3 py-1.5 text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 disabled:opacity-40 transition-all duration-150"
              >
                {aiLoading ? '⏳ Tarıyor...' : '✨ AI ile Tara'}
              </button>
              <button
                onClick={handleAnonymize}
                disabled={taggedCount === 0 || processing || isBusy}
                className="px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-blue-600/20"
              >
                {processing
                  ? 'İşleniyor...'
                  : `🔒 Maskele & İndir (${taggedCount} kolon)`}
              </button>
            </div>
          </div>

          <SheetTabs
            sheets={sheetNames}
            active={activeSheet}
            onChange={setActiveSheet}
          />

          <ColumnTable
            headers={headers}
            previewRows={previewRows}
            columnConfig={columnConfig[activeSheet] ?? {}}
            onToggle={handleToggle}
            aiSuggested={aiSuggested[activeSheet]}
          />

          <p className="text-xs text-zinc-600">
            Sütun başlığındaki butona tıklayarak tipi değiştir: YOK → KİŞİ →
            FİRMA → YOK
          </p>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 p-8 bg-green-500/5 border border-green-500/20 rounded-2xl">
            <span className="text-5xl">✅</span>
            <h2 className="text-lg font-semibold text-green-400">
              Maskeleme tamamlandı!
            </h2>
            <p className="text-sm text-zinc-400 text-center">
              Orijinal Excel formatı korunarak sadece seçili kolonlardaki
              isimler değiştirildi.
            </p>
            <p className="text-xs text-zinc-500 text-center">
              <span className="text-zinc-300 font-medium">
                anon_{filename}
              </span>{' '}
              ve{' '}
              <span className="text-zinc-300 font-medium">mapping JSON</span>{' '}
              indirildi.{' '}
              <span className="text-amber-400">
                Mapping JSON&apos;ını güvenli bir yerde saklayın.
              </span>
            </p>
          </div>
          <MappingTable mapping={mapping} />
          <button
            onClick={resetAll}
            className="self-center px-5 py-2 text-sm font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 hover:text-white transition-all duration-150 border border-zinc-700"
          >
            ↩ Yeni Dosya
          </button>
        </div>
      )}
    </div>
  )
}
