'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import DropZone from '@/components/DropZone'
import SheetTabs from '@/components/SheetTabs'
import ColumnTable from '@/components/ColumnTable'
import MappingTable from '@/components/MappingTable'
import { buildMapping, applyMapping } from '@/lib/anonymizer'
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
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [filename, setFilename] = useState('')
  const [sheetData, setSheetData] = useState<Record<string, unknown[][]>>({})
  const [activeSheet, setActiveSheet] = useState('')
  const [columnConfig, setColumnConfig] = useState<SheetColumnConfig>({})
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggested, setAiSuggested] = useState<Record<string, number[]>>({})
  const [processing, setProcessing] = useState(false)

  // De-anonymize state
  const [deanonWb, setDeanonWb] = useState<XLSX.WorkBook | null>(null)
  const [deanonFilename, setDeanonFilename] = useState('')
  const [deanonMapData, setDeanonMapData] = useState<AnonymizationMapping | null>(null)
  const [deanonDone, setDeanonDone] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const data: Record<string, unknown[][]> = {}
    const config: SheetColumnConfig = {}
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      data[sheetName] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]
      config[sheetName] = {}
    }
    setWorkbook(wb)
    setFilename(file.name)
    setSheetData(data)
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

  const handleAnonymize = useCallback(() => {
    if (!workbook) return
    setProcessing(true)
    try {
      const builtMapping = buildMapping(sheetData, columnConfig)
      const newWb = XLSX.utils.book_new()

      for (const sheetName of workbook.SheetNames) {
        const rows = sheetData[sheetName] ?? []
        const colConfig = columnConfig[sheetName] ?? {}
        const aoa = applyMapping(rows, colConfig, builtMapping)
        const ws = XLSX.utils.aoa_to_sheet(aoa)
        XLSX.utils.book_append_sheet(newWb, ws, sheetName)
      }

      // Add __MAPPING__ sheet
      const mapAoa: string[][] = [['Orijinal', 'Etiket'], ...Object.entries(builtMapping)]
      const mapWs = XLSX.utils.aoa_to_sheet(mapAoa)
      XLSX.utils.book_append_sheet(newWb, mapWs, '__MAPPING__')

      XLSX.writeFile(newWb, 'anon_' + filename)

      // Download mapping JSON
      const mapData: AnonymizationMapping = {
        version: 1,
        created: new Date().toISOString().slice(0, 10),
        originalFile: filename,
        mapping: builtMapping,
      }
      const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mapping_' + filename.replace(/\.xlsx?$/i, '.json')
      a.click()
      URL.revokeObjectURL(url)

      setMapping(builtMapping)
      setStep('done')
    } finally {
      setProcessing(false)
    }
  }, [workbook, sheetData, columnConfig, filename])

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

  // De-anonymize handlers
  const handleDeanonFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    setDeanonWb(wb)
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

  const handleDeanonymize = useCallback(() => {
    if (!deanonWb || !deanonMapData) return
    const reverseMap: Record<string, string> = Object.fromEntries(
      Object.entries(deanonMapData.mapping).map(([k, v]) => [v, k])
    )
    const newWb = XLSX.utils.book_new()
    for (const sheetName of deanonWb.SheetNames) {
      if (sheetName === '__MAPPING__') continue
      const ws = deanonWb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]
      const restored = rows.map((row, rIdx) => {
        if (rIdx === 0) return row.map(c => (c === null || c === undefined ? '' : String(c)))
        return row.map(cell => {
          const s = cell === null || cell === undefined ? '' : String(cell)
          return reverseMap[s] ?? s
        })
      })
      const restoredWs = XLSX.utils.aoa_to_sheet(restored)
      XLSX.utils.book_append_sheet(newWb, restoredWs, sheetName)
    }
    XLSX.writeFile(newWb, 'restored_' + deanonFilename)
    setDeanonDone(true)
  }, [deanonWb, deanonMapData, deanonFilename])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Veri Maskeleme Aracı</h1>
          <p className="text-gray-500">Excel dosyalarındaki kişi ve firma adlarını güvenle maskele</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('anon')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors
              ${activeTab === 'anon' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🔒 Maskele
          </button>
          <button
            onClick={() => setActiveTab('deanon')}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors
              ${activeTab === 'deanon' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🔓 Geri Al
          </button>
        </div>

        {/* Maskele Tab */}
        {activeTab === 'anon' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {step === 'upload' && (
              <DropZone onFile={handleFile} />
            )}

            {step === 'configure' && (
              <div className="flex flex-col gap-4">
                {/* File info bar */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{filename}</span>
                    <span className="text-gray-400">• {Object.keys(sheetData).length} sayfa</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAiScan}
                      disabled={aiLoading}
                      className="px-3 py-1.5 text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors"
                    >
                      {aiLoading ? '⏳ Tarıyor...' : '✨ AI ile Tara'}
                    </button>
                    <button
                      onClick={handleAnonymize}
                      disabled={taggedCount === 0 || processing}
                      className="px-3 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                    >
                      {processing ? 'İşleniyor...' : `🔒 Maskele & İndir (${taggedCount} kolon)`}
                    </button>
                  </div>
                </div>

                <SheetTabs
                  sheets={workbook?.SheetNames ?? []}
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

                <p className="text-xs text-gray-400">
                  Sütun başlığındaki butona tıklayarak tipi değiştir: YOK → KİŞİ → FİRMA → YOK
                </p>
              </div>
            )}

            {step === 'done' && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col items-center gap-2 p-6 bg-green-50 rounded-xl">
                  <span className="text-4xl">✅</span>
                  <h2 className="text-lg font-semibold text-green-800">Maskeleme tamamlandı!</h2>
                  <p className="text-sm text-green-700 text-center">
                    <strong>anon_{filename}</strong> ve <strong>mapping JSON</strong> dosyaları indirildi.
                    Mapping JSON&apos;ını güvenli bir yerde saklayın.
                  </p>
                </div>
                <MappingTable mapping={mapping} />
                <button
                  onClick={() => {
                    setStep('upload')
                    setWorkbook(null)
                    setFilename('')
                    setSheetData({})
                    setColumnConfig({})
                    setMapping({})
                    setAiSuggested({})
                  }}
                  className="self-center px-5 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ↩ Yeni Dosya
                </button>
              </div>
            )}
          </div>
        )}

        {/* Geri Al Tab */}
        {activeTab === 'deanon' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {!deanonDone ? (
              <div className="flex flex-col gap-5">
                <h2 className="text-base font-semibold text-gray-700">Maskelemeyi Geri Al</h2>

                {/* Step 1: Anon Excel */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Adım 1 — Anonim Excel dosyasını seç</p>
                  <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                    ${deanonWb ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {deanonWb ? `✓ ${deanonFilename}` : 'anon_*.xlsx dosyasını seç'}
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleDeanonFile(f) }}
                    />
                  </label>
                </div>

                {/* Step 2: Mapping JSON */}
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Adım 2 — Mapping JSON dosyasını seç</p>
                  <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                    ${deanonMapData ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    </svg>
                    <span className="text-sm text-gray-600">
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
                  disabled={!deanonWb || !deanonMapData}
                  className="self-start px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  🔓 Geri Yükle & İndir
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-6 bg-green-50 rounded-xl">
                <span className="text-4xl">✅</span>
                <h2 className="text-lg font-semibold text-green-800">Geri yükleme tamamlandı!</h2>
                <p className="text-sm text-green-700">restored_{deanonFilename} indirildi.</p>
                <button
                  onClick={() => {
                    setDeanonWb(null)
                    setDeanonFilename('')
                    setDeanonMapData(null)
                    setDeanonDone(false)
                  }}
                  className="px-5 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ↩ Yeni Dosya
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
