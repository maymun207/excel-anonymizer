// ---------------------------------------------------------------------------
// Lightweight i18n — two languages, zero dependencies
// ---------------------------------------------------------------------------

export type Locale = 'en' | 'tr'

export const translations = {
  // Header
  badge: {
    en: 'Privacy-First · Client-Side Processing',
    tr: 'Gizlilik Öncelikli · Tarayıcıda İşleme',
  },
  title: {
    en: 'Data Anonymization Tool',
    tr: 'Veri Maskeleme Aracı',
  },
  subtitle: {
    en: 'Safely anonymize personal and company names in Excel files — your data never leaves your device',
    tr: 'Excel dosyalarındaki kişi ve firma adlarını güvenle maskele — veriler cihazınızdan çıkmaz',
  },

  // Tabs
  tabAnonymize: { en: '🔒 Anonymize', tr: '🔒 Maskele' },
  tabRestore: { en: '🔓 Restore', tr: '🔓 Geri Al' },

  // Footer
  footer: {
    en: 'All processing happens in your browser · Your files are never sent to any server',
    tr: 'Tüm işlemler tarayıcınızda gerçekleşir · Dosyalarınız hiçbir sunucuya gönderilmez',
  },

  // DropZone
  dropTitle: {
    en: 'Drag & drop an Excel file or click to browse',
    tr: 'Excel dosyasını buraya sürükle veya tıkla',
  },
  dropHint: { en: '.xlsx or .xls', tr: '.xlsx veya .xls' },

  // AnonymizePanel — configure toolbar
  pages: { en: 'sheets', tr: 'sayfa' },
  aiAllTabs: { en: '🚀 AI All Tabs', tr: '🚀 AI tüm tablar' },
  aiScan: { en: '✨ AI Scan', tr: '✨ AI ile tara' },
  aiScanning: { en: '⏳ Scanning...', tr: '⏳ Tarıyor...' },
  processing: { en: 'Processing...', tr: 'İşleniyor...' },
  anonymizeBtn: {
    en: (n: number) => `🔒 Anonymize & Download (${n} cols)`,
    tr: (n: number) => `🔒 Maskele & İndir (${n} kolon)`,
  },
  columnHint: {
    en: 'Click the column header button to cycle type: NONE → PERSON → ORG → NONE',
    tr: 'Sütun başlığındaki butona tıklayarak tipi değiştir: YOK → KİŞİ → FİRMA → YOK',
  },

  // AnonymizePanel — done
  doneTitle: { en: 'Anonymization complete!', tr: 'Maskeleme tamamlandı!' },
  doneDesc: {
    en: 'Original Excel formatting preserved — only names in selected columns were replaced.',
    tr: 'Orijinal Excel formatı korunarak sadece seçili kolonlardaki isimler değiştirildi.',
  },
  doneFiles: {
    en: (f: string) => `anon_${f} and mapping JSON downloaded.`,
    tr: (f: string) => `anon_${f} ve mapping JSON indirildi.`,
  },
  doneWarning: {
    en: 'Keep the mapping JSON in a safe place.',
    tr: "Mapping JSON'ını güvenli bir yerde saklayın.",
  },
  newFile: { en: '↩ New File', tr: '↩ Yeni Dosya' },

  // DeanonymizePanel
  restoreTitle: { en: 'Reverse Anonymization', tr: 'Maskelemeyi Geri Al' },
  restoreStep1: {
    en: 'Step 1 — Select the anonymized Excel file',
    tr: 'Adım 1 — Anonim Excel dosyasını seç',
  },
  restoreStep1Hint: {
    en: 'Select anon_*.xlsx file',
    tr: 'anon_*.xlsx dosyasını seç',
  },
  restoreStep2: {
    en: 'Step 2 — Select the mapping JSON file',
    tr: 'Adım 2 — Mapping JSON dosyasını seç',
  },
  restoreStep2Hint: {
    en: 'Select mapping_*.json file',
    tr: 'mapping_*.json dosyasını seç',
  },
  restoreBtn: { en: '🔓 Restore & Download', tr: '🔓 Geri Yükle & İndir' },
  restoreDoneTitle: {
    en: 'Restoration complete!',
    tr: 'Geri yükleme tamamlandı!',
  },
  restoreDoneDesc: {
    en: (f: string) => `restored_${f} downloaded.`,
    tr: (f: string) => `restored_${f} indirildi.`,
  },
  records: { en: 'records', tr: 'kayıt' },

  // MappingTable
  mappingTitle: { en: 'Anonymization Map', tr: 'Maskeleme Haritası' },
  mappingOriginal: { en: 'Original', tr: 'Orijinal' },
  mappingLabel: { en: 'Label', tr: 'Etiket' },
  mappingEmpty: {
    en: 'No anonymization map yet',
    tr: 'Henüz maskeleme haritası yok',
  },

  // ColumnTable
  columnFallback: {
    en: (n: number) => `Col ${n}`,
    tr: (n: number) => `Kolon ${n}`,
  },
  noPreview: {
    en: 'No preview data available',
    tr: 'Önizleme için veri yok',
  },
  typeLabels: {
    en: { none: 'NONE', PERSON: 'PERSON', ORG: 'ORG' } as const,
    tr: { none: 'YOK', PERSON: 'KİŞİ', ORG: 'FİRMA' } as const,
  },

  // Alerts / errors (used in hooks)
  aiScanError: { en: 'AI scan error', tr: 'AI tarama hatası' },
  anonymizeError: { en: 'Anonymization error', tr: 'Maskeleme hatası' },
  restoreError: { en: 'Restoration error', tr: 'Geri yükleme hatası' },
  mappingParseError: {
    en: 'Could not parse mapping JSON',
    tr: 'Mapping JSON okunamadı',
  },
  aiScanFailed: {
    en: (s: string) => `AI scan failed (${s})`,
    tr: (s: string) => `AI tarama başarısız (${s})`,
  },
} as const

// Convenience type for the full dictionary
export type Translations = typeof translations

// Helper to get a simple string value for current locale
export function t(
  key: keyof Translations,
  locale: Locale,
): string | ((...args: never[]) => string) {
  const entry = translations[key]
  return entry[locale] as string | ((...args: never[]) => string)
}
