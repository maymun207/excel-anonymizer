import type { SheetColumnConfig, ColumnTypeMap } from './types'

export function buildMapping(
  sheetData: Record<string, unknown[][]>,
  columnConfig: SheetColumnConfig
): Record<string, string> {
  const mapping: Record<string, string> = {}
  let personCount = 0
  let orgCount = 0

  for (const [sheetName, rows] of Object.entries(sheetData)) {
    const colConfig: ColumnTypeMap = columnConfig[sheetName] ?? {}
    for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx]
      for (const [colIdxStr, colType] of Object.entries(colConfig)) {
        if (colType === 'none') continue
        const colIdx = Number(colIdxStr)
        const cellVal = row[colIdx]
        if (cellVal === null || cellVal === undefined) continue
        const val = String(cellVal).trim()
        if (val === '') continue
        if (val in mapping) continue
        if (colType === 'PERSON') {
          personCount++
          mapping[val] = `K\u0130\u015e\u0130_${String(personCount).padStart(3, '0')}`
        } else if (colType === 'ORG') {
          orgCount++
          mapping[val] = `F\u0130RMA_${String(orgCount).padStart(3, '0')}`
        }
      }
    }
  }
  return mapping
}

export function applyMapping(
  rows: unknown[][],
  columnConfig: ColumnTypeMap,
  mapping: Record<string, string>
): string[][] {
  return rows.map((row, rowIdx) => {
    if (rowIdx === 0) {
      return row.map(cell => (cell === null || cell === undefined ? '' : String(cell)))
    }
    return row.map((cell, colIdx) => {
      const raw = cell === null || cell === undefined ? '' : String(cell)
      const colType = columnConfig[colIdx]
      if (!colType || colType === 'none') return raw
      const trimmed = raw.trim()
      return mapping[trimmed] ?? raw
    })
  })
}
