'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import DropZone from '@/components/DropZone'
import SheetTabs from '@/components/SheetTabs'
import ColumnTable from '@/components/ColumnTable'
import MappingTable from '@/components/MappingTable'
import { anonymizeBuffer, deanonymizeBuffer } from '@/lib/anonymizer'
import type {
  SheetColumnConfig,
  ColumnType,
  AnonymizationMapping,
  AiScanRequest,
  AiScanResponse,
} from '@/lib/types'

type ActiveTab = 'anon' | 'deanon'
type Step = 'upload' | 'configure' | 'done'

const cycleType = (t: ColumnType): ColumnType =>
  t === 'none' ? 'PERSON' : t === 'PERSON' ? 'ORG' : 'none'

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('anon')
  const [step, setStep] = useState<Step>('upload')

  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [filename, setFilename] = useState('')
  const [sheetData, setSheetData] = useState<Record<string, unknown[][]>>({})
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState('')
  const [columnConfig, setColumnConfig] = useState<SheetColumnConfig>({})
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggested, setAiSuggested] = useState<Record<string, number[]>>({})
  const [processing, setProcessing] = useState(false)

  const [deanonBuffer, setDeanonBuffer] = useState<ArrayBuffer | null>(null)
  const [deanonFilename, setDeanonFilename] = useState('')
  const [deanonMapData, setDeanonMapData] = useState<AnonymizationMapping | null>(null)
  const [deanonDone, setDeanonDone] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, {
      type: 'array',
      cellStyles: true,
      cellNF: true,
      cellFormula: true,
      sheetStubs: true,
    })

    const data: Record<string, unknown[][]> = {}
    const config: SheetColumnConfig = {}
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      data[sheetName] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: '',
        raw: false,
      }) as unknown[][]
      config[sheetName] = {}
    }

    setFileBuffer(buffer)
    setFilename(file.name)
    setSheetData(data)
    setSheetNames(wb.SheetNames)
    setColumnConfig(config)
    setActiveSheet(wb.SheetNames[0] ?? '')
    setStep('configure')
  }, [])

  const handleAiScan = useCallback(async () => {
    if (!activeSheet || !sheetData[activeSheet]) return
    setAiLoading(true)
    try {
      const rows = sheetData[activeSheet]
      const headers = (rows[0] ?? []).map(h => (h === null || h === undefined ? '' : String(h)))
      const dataRows = rows.slice(1, 11)

      const columns: AiScanRequest['columns'] = headers
        .map((header, idx) => {
          const samples = dataRows
            .map(row => {
              const val = row[idx]
              return val === null || val === undefined ? '' : String(val).trim()
            })
            .filter(v => v !== '')
            .slice(0, 5)
          return { index: idx, header, samples }
        })
        .filter(c => c.samples.length > 0)

      const res = await fetch('/api/ai-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName: activeSheet, columns } satisfies AiScanRequest),
      })

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'AI tarama başarısız')
      }

      const data: AiScanResponse = await res.json() as AiScanResponse
      const suggested: number[] = []

      setColumnConfig(prev => {
        const updated = { ...prev }
        const sheetConfig = { ...(updated[activeSheet] ?? {}) }
        for (const col of data.columns) {
          if (col.type === 'OTHER' || col.confidence === 'low') continue
          if (sheetConfig[col.index] && sheetConfig[col.index] !== 'none') continue
          sheetConfig[col.index] = col.type as ColumnType
          suggested.push(col.index)
        }
        updated[activeSheet] = sheetConfig
        return updated
      })

      setAiSuggested(prev => ({ ...prev, [activeSheet]: suggested }))
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'AI tarama hatası')
    } finally {
      setAiLoading(false)
    }
  }, [activeSheet, sheetData])

  const handleAnonymize = useCallback(async () => {
    if (!fileBuffer) return
    setProcessing(true)
    try {
      // ZIP-level patch: ONLY xl/sharedStrings.xml values are changed.
      // xl/styles.xml, sheet XML formatting attributes — everything else is
      // untouched bit-for-bit. Row colors, borders, fonts all survive.
      const { buffer: outBuffer, mapping: builtMapping } = await anonymizeBuffer(
        fileBuffer,
        sheetData,
        columnConfig,
      )

      const blob = new Blob([outBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'anon_' + filename
      a.click()
      URL.revokeObjectURL(url)

      const mapData: AnonymizationMapping = {
        version: 1,
        created: new Date().toISOString().slice(0, 10),
        originalFile: filename,
        mapping: builtMapping,
      }
      const mapBlob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' })
      const mapUrl = URL.createObjectURL(mapBlob)
      const mapA = document.createElement('a')
      mapA.href = mapUrl
      mapA.download = 'mapping_' + filename.replace(/\.xlsx?$/i, '.json')
      mapA.click()
      URL.revokeObjectURL(mapUrl)

      setMapping(builtMapping)
      setStep('done')
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Maskeleme hatası')
    } finally {
      setProcessing(false)
    }
  }, [fileBuffer, sheetData, columnConfig, filename])

  const handleToggle = useCallback((colIdx: number) => {
    setColumnConfig(prev => {
      const updated = { ...prev }
      const sheetConfig = { ...(updated[activeSheet] ?? {}) }
      sheetConfig[colIdx] = cycleType(sheetConfig[colIdx] ?? 'none')
      updated[activeSheet] = sheetConfig
      return updated
    })
  }, [activeSheet])

  const taggedCount = Object.values(columnConfig)
    .flatMap(cols => Object.values(cols))
    .filter(t => t !== 'none').length

  const currentRows = sheetData[activeSheet] ?? []
  const headers = (currentRows[0] ?? []).map(h => (h === null || h === undefined ? '' : String(h)))
  const previewRows = currentRows.slice(1, 6)

  const handleDeanonFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer()
    setDeanonBuffer(buffer)
    setDeanonFilename(file.name)
  }, [])

  const handleDeanonMap = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as AnonymizationMapping
        setDeanonMapData(parsed)
      } catch {
        alert('Mapping JSON okunamadı')
      }
    }
    reader.readAsText(file)
  }, [])

  const handleDeanonymize = useCallback(async () => {
    if (!deanonBuffer || !deanonMapData) return
    try {
      const reverseMapping: Record<string, string> = Object.fromEntries(
        Object.entries(deanonMapData.mapping).map(([k, v]) => [v, k]),
      )
      const outBuffer = await deanonymizeBuffer(deanonBuffer, reverseMapping)

      const blob = new Blob([outBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'restored_' + deanonFilename
      a.click()
      URL.revokeObjectURL(url)

      setDeanonDone(true)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Geri yükleme hatası')
    }
  }, [deanonBuffer, deanonMapData, deanonFilename])

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="max-w-5xl mx-auto px-4 py-12">

        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Privacy-First · Client-Side Processing
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Veri Maskeleme Aracı
          </h1>
          <p className="text-zinc-500 text-sm">
            Excel dosyalarındaki kişi ve firma adlarını güvenle maskele — veriler cihazınızdan çıkmaz
          </p>
        </div>

        <div className="flex gap-1 mb-6 p-1 bg-zinc-900 border border-zinc-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('anon')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200
              ${activeTab === 'anon'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            🔒 Maskele
          </button>
          <button
            onClick={() => setActiveTab('deanon')}
            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200
              ${activeTab === 'deanon'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            🔓 Geri Al
          </button>
        </div>

        {activeTab === 'anon' && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-xl shadow-black/20">
            {step === 'upload' && <DropZone onFile={handleFile} />}

            {step === 'configure' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/50">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium text-zinc-200">{filename}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-500">{sheetNames.length} sayfa</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAiScan}
                      disabled={aiLoading}
                      className="px-3 py-1.5 text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 disabled:opacity-40 transition-all duration-150"
                    >
                      {aiLoading ? '⏳ Tarıyor...' : '✨ AI ile Tara'}
                    </button>
                    <button
                      onClick={handleAnonymize}
                      disabled={taggedCount === 0 || processing}
                      className="px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-blue-600/20"
                    >
                      {processing ? 'İşleniyor...' : `🔒 Maskele & İndir (${taggedCount} kolon)`}
                    </button>
                  </div>
                </div>

                <SheetTabs sheets={sheetNames} active={activeSheet} onChange={setActiveSheet} />

                <ColumnTable
                  headers={headers}
                  previewRows={previewRows}
                  columnConfig={columnConfig[activeSheet] ?? {}}
                  onToggle={handleToggle}
                  aiSuggested={aiSuggested[activeSheet]}
                />

                <p className="text-xs text-zinc-600">
                  Sütun başlığındaki butona tıklayarak tipi değiştir: YOK → KİŞİ → FİRMA → YOK
                </p>
              </div>
            )}

            {step === 'done' && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-3 p-8 bg-green-500/5 border border-green-500/20 rounded-2xl">
                  <span className="text-5xl">✅</span>
                  <h2 className="text-lg font-semibold text-green-400">Maskeleme tamamlandı!</h2>
                  <p className="text-sm text-zinc-400 text-center">
                    Orijinal Excel formatı korunarak sadece seçili kolonlardaki isimler değiştirildi.
                  </p>
                  <p className="text-xs text-zinc-500 text-center">
                    <span className="text-zinc-300 font-medium">anon_{filename}</span>
                    {' '}ve{' '}
                    <span className="text-zinc-300 font-medium">mapping JSON</span>
                    {' '}indirildi.{' '}
                    <span className="text-amber-400">Mapping JSON&apos;ını güvenli bir yerde saklayın.</span>
                  </p>
                </div>
                <MappingTable mapping={mapping} />
                <button
                  onClick={() => {
                    setStep('upload')
                    setFileBuffer(null)
                    setFilename('')
                    setSheetData({})
                    setSheetNames([])
                    setColumnConfig({})
                    setMapping({})
                    setAiSuggested({})
                  }}
                  className="self-center px-5 py-2 text-sm font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 hover:text-white transition-all duration-150 border border-zinc-700"
                >
                  ↩ Yeni Dosya
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deanon' && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-xl shadow-black/20">
            {!deanonDone ? (
              <div className="flex flex-col gap-5">
                <h2 className="text-base font-semibold text-zinc-200">Maskelemeyi Geri Al</h2>

                <div>
                  <p className="text-sm font-medium text-zinc-400 mb-2">Adım 1 — Anonim Excel dosyasını seç</p>
                  <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150
                    ${deanonBuffer
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-zinc-700 bg-zinc-800/30 hover:border-blue-500/50 hover:bg-blue-500/5'}`}>
                    <svg className={`w-5 h-5 flex-shrink-0 ${deanonBuffer ? 'text-green-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className={`text-sm ${deanonBuffer ? 'text-green-400' : 'text-zinc-500'}`}>
                      {deanonBuffer ? `✓ ${deanonFilename}` : 'anon_*.xlsx dosyasını seç'}
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleDeanonFile(f) }}
                    />
                  </label>
                </div>

                <div>
                  <p className="text-sm font-medium text-zinc-400 mb-2">Adım 2 — Mapping JSON dosyasını seç</p>
                  <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150
                    ${deanonMapData
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-zinc-700 bg-zinc-800/30 hover:border-blue-500/50 hover:bg-blue-500/5'}`}>
                    <svg className={`w-5 h-5 flex-shrink-0 ${deanonMapData ? 'text-green-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    </svg>
                    <span className={`text-sm ${deanonMapData ? 'text-green-400' : 'text-zinc-500'}`}>
                      {deanonMapData
                        ? `✓ ${deanonMapData.originalFile} — ${Object.keys(deanonMapData.mapping).length} kayıt`
                        : 'mapping_*.json dosyasını seç'}
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleDeanonMap(f) }}
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
                <h2 className="text-lg font-semibold text-green-400">Geri yükleme tamamlandı!</h2>
                <p className="text-sm text-zinc-400">restored_{deanonFilename} indirildi.</p>
                <button
                  onClick={() => {
                    setDeanonBuffer(null)
                    setDeanonFilename('')
                    setDeanonMapData(null)
                    setDeanonDone(false)
                  }}
                  className="px-5 py-2 text-sm font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:text-white transition-all duration-150"
                >
                  ↩ Yeni Dosya
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-zinc-700 mt-8">
          Tüm işlemler tarayıcınızda gerçekleşir · Dosyalarınız hiçbir sunucuya gönderilmez
        </p>
      </div>
    </div>
  )
}
