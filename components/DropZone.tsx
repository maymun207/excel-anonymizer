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
      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-12 cursor-pointer transition-colors
        ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-base font-medium text-gray-600">
        Excel dosyasını buraya sürükle veya tıkla
      </p>
      <p className="text-sm text-gray-400">.xlsx veya .xls</p>
      <input
        id="file-input"
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}
