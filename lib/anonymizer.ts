import * as XLSX from 'xlsx'
import type { SheetColumnConfig, ColumnType } from './types'

export function buildMapping(
  sheetData: Record<string, unknown[][]>,
  columnConfig: SheetColumnConfig
): Record<string, string> {
  const mapping: Record<string, string> = {}
  let personCount = 0
  let orgCount = 0

  for (const [sheetName, rows] of Object.entries(sheetData)) {
    const colConfig = columnConfig[sheetName] ?? {}
    for (let rIdx = 1; rIdx < rows.length; rIdx++) {
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

/**
 * Modify workbook cells IN-PLACE.
 * Preserves ALL original formatting: styles, merges, formulas, column widths.
 * Only .v and .w of configured column cells are replaced.
 */
export function anonymizeWorkbookInPlace(
  wb: XLSX.WorkBook,
  sheetData: Record<string, unknown[][]>,
  columnConfig: SheetColumnConfig
): Record<string, string> {
  const mapping = buildMapping(sheetData, columnConfig)

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    if (!ws || !ws['!ref']) continue
    const colConfig = columnConfig[sheetName] ?? {}
    const range = XLSX.utils.decode_range(ws['!ref'])

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const colType: ColumnType = (colConfig[col] as ColumnType) ?? 'none'
        if (colType === 'none') continue
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = ws[cellAddr]
        if (!cell) continue
        const original = String(cell.v ?? '').trim()
        const replacement = mapping[original]
        if (replacement !== undefined) {
          cell.v = replacement
          cell.w = replacement
        }
      }
    }
  }
  return mapping
}

/**
 * Reverse anonymization in-place using a saved mapping.
 */
export function deanonymizeWorkbookInPlace(
  wb: XLSX.WorkBook,
  reverseMapping: Record<string, string>
): void {
  for (const sheetName of wb.SheetNames) {
    if (sheetName === '__MAPPING__') continue
    const ws = wb.Sheets[sheetName]
    if (!ws || !ws['!ref']) continue
    const range = XLSX.utils.decode_range(ws['!ref'])

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col })
        const cell = ws[cellAddr]
        if (!cell) continue
        const label = String(cell.v ?? '').trim()
        const original = reverseMapping[label]
        if (original !== undefined) {
          cell.v = original
          cell.w = original
        }
      }
    }
  }
}
