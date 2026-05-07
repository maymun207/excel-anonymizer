export type ColumnType = 'none' | 'PERSON' | 'ORG'

export interface ColumnTypeMap {
  [colIndex: number]: ColumnType
}

export interface SheetColumnConfig {
  [sheetName: string]: ColumnTypeMap
}

export interface AnonymizationMapping {
  version: number
  created: string
  originalFile: string
  mapping: Record<string, string>  // { "Ahmet Yılmaz": "KİŞİ_001" }
}

export interface AiScanRequest {
  sheetName: string
  columns: Array<{
    index: number
    header: string
    samples: string[]
  }>
}

export interface AiScanResponse {
  columns: Array<{
    index: number
    type: 'PERSON' | 'ORG' | 'OTHER'
    confidence: 'high' | 'medium' | 'low'
  }>
}
