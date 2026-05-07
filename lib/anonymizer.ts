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

/**
 * Collect all XML file paths under xl/ that may contain cell text.
 * This covers sharedStrings, all worksheets (including non-standard names),
 * chartsheets, and any other XML that might embed text.
 */
function collectPatchableXmlPaths(zip: JSZip): string[] {
  const paths: string[] = []
  zip.forEach((relativePath: string) => {
    if (relativePath.startsWith('xl/') && relativePath.endsWith('.xml')) {
      // Skip styles and theme — they never contain user text
      if (relativePath === 'xl/styles.xml') return
      if (relativePath.startsWith('xl/theme/')) return
      paths.push(relativePath)
    }
  })
  return paths
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Anonymize an xlsx buffer at the ZIP level.
 *
 * ONLY <t>...</t> text nodes inside xl/*.xml files are modified.
 * xl/styles.xml, xl/theme/*, drawings, images — everything else is
 * untouched bit-for-bit.
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

  // Patch every XML under xl/ that could contain cell text
  const xmlPaths = collectPatchableXmlPaths(zip)
  for (const path of xmlPaths) {
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
 * Patches ALL xml files under xl/ to ensure every tab is restored.
 */
export async function deanonymizeBuffer(
  anonymizedBuffer: ArrayBuffer,
  reverseMapping: Record<string, string>, // label → original
): Promise<ArrayBuffer> {
  const entries = Object.entries(reverseMapping) as [string, string][]

  if (entries.length === 0) return anonymizedBuffer

  const zip = await JSZip.loadAsync(anonymizedBuffer)

  // Patch every XML under xl/ that could contain cell text
  const xmlPaths = collectPatchableXmlPaths(zip)
  for (const path of xmlPaths) {
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
