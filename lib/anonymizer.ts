import JSZip from 'jszip'
import type { SheetColumnConfig, ColumnType } from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function replaceAll(str: string, find: string, replace: string): string {
  if (!find) return str
  return str.split(find).join(replace)
}

// ---------------------------------------------------------------------------
// Build mapping from sheetData + column config
// ---------------------------------------------------------------------------

export function buildMapping(
  sheetData: Record<string, unknown[][]>,
  columnConfig: SheetColumnConfig,
): Record<string, string> {
  const mapping: Record<string, string> = {}
  let personCount = 0
  let orgCount = 0

  for (const [sheetName, rows] of Object.entries(sheetData)) {
    const colConfig = columnConfig[sheetName] ?? {}
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx]
      for (const [colIdxStr, colType] of Object.entries(colConfig)) {
        if (colType === 'none') continue
        const colIdx = Number(colIdxStr)
        const raw = row[colIdx]
        const val = raw === null || raw === undefined ? '' : String(raw).trim()
        if (!val || mapping[val] !== undefined) continue
        if (colType === 'PERSON') {
          personCount += 1
          mapping[val] = `KİŞİ_${String(personCount).padStart(3, '0')}`
        } else if (colType === 'ORG') {
          orgCount += 1
          mapping[val] = `FİRMA_${String(orgCount).padStart(3, '0')}`
        }
      }
    }
  }
  return mapping
}

// ---------------------------------------------------------------------------
// ZIP-level patch helpers
// ---------------------------------------------------------------------------

/**
 * Patch a single XML string: replace all occurrences of each original name
 * with its anonymized label, in both <t>...</t> and <t xml:space="preserve">...</t> forms.
 */
function patchXml(
  xml: string,
  entries: [string, string][],   // [original, replacement]
): string {
  for (const [original, replacement] of entries) {
    const esc = escapeXml(original)
    const replEsc = escapeXml(replacement)
    // plain form
    xml = replaceAll(xml, `<t>${esc}</t>`, `<t>${replEsc}</t>`)
    // preserve form
    xml = replaceAll(
      xml,
      `<t xml:space="preserve">${esc}</t>`,
      `<t xml:space="preserve">${replEsc}</t>`,
    )
  }
  return xml
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Anonymize an xlsx buffer at the ZIP level.
 *
 * ONLY xl/sharedStrings.xml (and inline strings in sheet XMLs) are modified.
 * xl/styles.xml, xl/theme/*, xl/worksheets/sheet*.xml (formatting attributes),
 * drawings, images — everything else is untouched bit-for-bit.
 */
export async function anonymizeBuffer(
  originalBuffer: ArrayBuffer,
  sheetData: Record<string, unknown[][]>,
  columnConfig: SheetColumnConfig,
): Promise<{ buffer: ArrayBuffer; mapping: Record<string, string> }> {
  const mapping = buildMapping(sheetData, columnConfig)
  const entries = Object.entries(mapping) as [string, string][]

  if (entries.length === 0) {
    // Nothing to anonymize — return original
    return { buffer: originalBuffer, mapping }
  }

  const zip = await JSZip.loadAsync(originalBuffer)

  // 1. Patch shared strings (the primary string store in xlsx)
  const ssFile = zip.file('xl/sharedStrings.xml')
  if (ssFile) {
    const xml = await ssFile.async('text')
    zip.file('xl/sharedStrings.xml', patchXml(xml, entries))
  }

  // 2. Patch inline strings in each sheet XML (rare, but cover it)
  const sheetPaths: string[] = []
  zip.forEach((rel: string) => {
    if (/^xl\/worksheets\/sheet\d+\.xml$/.test(rel)) sheetPaths.push(rel)
  })
  for (const path of sheetPaths) {
    const f = zip.file(path)
    if (!f) continue
    const xml = await f.async('text')
    const patched = patchXml(xml, entries)
    if (patched !== xml) zip.file(path, patched)
  }

  const buffer = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return { buffer, mapping }
}

/**
 * De-anonymize an xlsx buffer at the ZIP level (reverse mapping).
 */
export async function deanonymizeBuffer(
  anonymizedBuffer: ArrayBuffer,
  reverseMapping: Record<string, string>, // label → original
): Promise<ArrayBuffer> {
  const entries = Object.entries(reverseMapping) as [string, string][]

  if (entries.length === 0) return anonymizedBuffer

  const zip = await JSZip.loadAsync(anonymizedBuffer)

  const ssFile = zip.file('xl/sharedStrings.xml')
  if (ssFile) {
    const xml = await ssFile.async('text')
    zip.file('xl/sharedStrings.xml', patchXml(xml, entries))
  }

  const sheetPaths: string[] = []
  zip.forEach((rel: string) => {
    if (/^xl\/worksheets\/sheet\d+\.xml$/.test(rel)) sheetPaths.push(rel)
  })
  for (const path of sheetPaths) {
    const f = zip.file(path)
    if (!f) continue
    const xml = await f.async('text')
    const patched = patchXml(xml, entries)
    if (patched !== xml) zip.file(path, patched)
  }

  return zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}
