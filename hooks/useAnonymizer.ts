'use client'

import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { anonymizeBuffer, deanonymizeBuffer } from '@/lib/anonymizer'
import type {
  SheetColumnConfig,
  ColumnType,
  AnonymizationMapping,
  AiScanRequest,
  AiScanResponse,
} from '@/lib/types'

export type Step = 'upload' | 'configure' | 'done'

const cycleType = (t: ColumnType): ColumnType =>
  t === 'none' ? 'PERSON' : t === 'PERSON' ? 'ORG' : 'none'

export function useAnonymizer() {
  const [step, setStep] = useState<Step>('upload')

  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [filename, setFilename] = useState('')
  const [sheetData, setSheetData] = useState<Record<string, unknown[][]>>({})
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState('')
  const [columnConfig, setColumnConfig] = useState<SheetColumnConfig>({})
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAllLoading, setAiAllLoading] = useState(false)
  const [aiAllProgress, setAiAllProgress] = useState('')
  const [aiSuggested, setAiSuggested] = useState<Record<string, number[]>>({})
  const [processing, setProcessing] = useState(false)

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

  const scanSheet = useCallback(
    async (
      sheetName: string,
    ): Promise<{ suggested: number[]; data: AiScanResponse } | null> => {
      const rows = sheetData[sheetName]
      if (!rows || rows.length === 0) return null

      const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0)
      if (maxCols === 0) return null

      const firstDataRowIdx = rows.findIndex(row =>
        row.some(
          cell =>
            cell !== null && cell !== undefined && String(cell).trim() !== '',
        ),
      )
      const headerRow = firstDataRowIdx >= 0 ? rows[firstDataRowIdx] : []
      const headers = Array.from({ length: maxCols }, (_, i) => {
        const h = headerRow[i]
        return h === null || h === undefined ? '' : String(h).trim()
      })

      const columns: AiScanRequest['columns'] = Array.from(
        { length: maxCols },
        (_, idx) => {
          const samples: string[] = []
          for (let rIdx = 0; rIdx < rows.length; rIdx++) {
            if (rIdx === firstDataRowIdx) continue
            const val = rows[rIdx]?.[idx]
            const str =
              val === null || val === undefined ? '' : String(val).trim()
            if (str !== '' && !samples.includes(str)) samples.push(str)
            if (samples.length >= 10) break
          }
          return { index: idx, header: headers[idx] ?? '', samples }
        },
      ).filter(c => c.samples.length > 0)

      if (columns.length === 0) return null

      const res = await fetch('/api/ai-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName, columns } satisfies AiScanRequest),
      })

      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error ?? `AI tarama başarısız (${sheetName})`)
      }

      const data: AiScanResponse = (await res.json()) as AiScanResponse
      const suggested: number[] = []

      setColumnConfig(prev => {
        const updated = { ...prev }
        const sheetConfig = { ...(updated[sheetName] ?? {}) }
        for (const col of data.columns) {
          if (col.type === 'OTHER' || col.confidence === 'low') continue
          if (sheetConfig[col.index] && sheetConfig[col.index] !== 'none')
            continue
          sheetConfig[col.index] = col.type as ColumnType
          suggested.push(col.index)
        }
        updated[sheetName] = sheetConfig
        return updated
      })

      setAiSuggested(prev => ({ ...prev, [sheetName]: suggested }))
      return { suggested, data }
    },
    [sheetData],
  )

  const handleAiScan = useCallback(async () => {
    if (!activeSheet || !sheetData[activeSheet]) return
    setAiLoading(true)
    try {
      await scanSheet(activeSheet)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'AI tarama hatası')
    } finally {
      setAiLoading(false)
    }
  }, [activeSheet, sheetData, scanSheet])

  const handleAiScanAll = useCallback(async () => {
    if (sheetNames.length === 0) return
    setAiAllLoading(true)
    try {
      for (let i = 0; i < sheetNames.length; i++) {
        setAiAllProgress(`${i + 1}/${sheetNames.length}: ${sheetNames[i]}`)
        await scanSheet(sheetNames[i])
      }
      setAiAllProgress('')
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'AI tarama hatası')
    } finally {
      setAiAllLoading(false)
      setAiAllProgress('')
    }
  }, [sheetNames, scanSheet])

  const handleAnonymize = useCallback(async () => {
    if (!fileBuffer) return
    setProcessing(true)
    try {
      const { buffer: outBuffer, mapping: builtMapping } =
        await anonymizeBuffer(fileBuffer, sheetData, columnConfig)

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
      const mapBlob = new Blob([JSON.stringify(mapData, null, 2)], {
        type: 'application/json',
      })
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

  const handleToggle = useCallback(
    (colIdx: number) => {
      setColumnConfig(prev => {
        const updated = { ...prev }
        const sheetConfig = { ...(updated[activeSheet] ?? {}) }
        sheetConfig[colIdx] = cycleType(sheetConfig[colIdx] ?? 'none')
        updated[activeSheet] = sheetConfig
        return updated
      })
    },
    [activeSheet],
  )

  const resetAll = useCallback(() => {
    setStep('upload')
    setFileBuffer(null)
    setFilename('')
    setSheetData({})
    setSheetNames([])
    setColumnConfig({})
    setMapping({})
    setAiSuggested({})
  }, [])

  const taggedCount = Object.values(columnConfig)
    .flatMap(cols => Object.values(cols))
    .filter(t => t !== 'none').length

  const currentRows = sheetData[activeSheet] ?? []
  const headers = (currentRows[0] ?? []).map(h =>
    h === null || h === undefined ? '' : String(h),
  )
  const previewRows = currentRows.slice(1, 6)

  const isBusy = aiLoading || aiAllLoading

  return {
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
  }
}

export function useDeanonymizer() {
  const [deanonBuffer, setDeanonBuffer] = useState<ArrayBuffer | null>(null)
  const [deanonFilename, setDeanonFilename] = useState('')
  const [deanonMapData, setDeanonMapData] =
    useState<AnonymizationMapping | null>(null)
  const [deanonDone, setDeanonDone] = useState(false)

  const handleDeanonFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer()
    setDeanonBuffer(buffer)
    setDeanonFilename(file.name)
  }, [])

  const handleDeanonMap = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const parsed = JSON.parse(
          e.target?.result as string,
        ) as AnonymizationMapping
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

  const resetDeanon = useCallback(() => {
    setDeanonBuffer(null)
    setDeanonFilename('')
    setDeanonMapData(null)
    setDeanonDone(false)
  }, [])

  return {
    deanonBuffer,
    deanonFilename,
    deanonMapData,
    deanonDone,
    handleDeanonFile,
    handleDeanonMap,
    handleDeanonymize,
    resetDeanon,
  }
}
