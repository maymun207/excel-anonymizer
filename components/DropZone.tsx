'use client'

import { useState, useCallback, DragEvent, ChangeEvent } from 'react'

interface DropZoneProps {
  onFile: (file: File) => void
}

export default function DropZone({ onFile }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl p-16 cursor-pointer transition-all duration-200
        ${dragging
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
          : 'border-zinc-700 bg-zinc-900/50 hover:border-blue-500/60 hover:bg-blue-500/5'}`}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <div className={`p-4 rounded-2xl transition-colors ${dragging ? 'bg-blue-500/20' : 'bg-zinc-800'}`}>
        <svg className={`w-10 h-10 transition-colors ${dragging ? 'text-blue-400' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-base font-medium text-zinc-200">Excel dosyasını buraya sürükle veya tıkla</p>
        <p className="text-sm text-zinc-500 mt-1">.xlsx veya .xls</p>
      </div>
      <input id="file-input" type="file" accept=".xlsx,.xls" className="hidden" onChange={handleChange} />
    </div>
  )
}
