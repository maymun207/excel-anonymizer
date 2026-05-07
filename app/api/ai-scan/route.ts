import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { AiScanRequest, AiScanResponse } from '@/lib/types'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY tan\u0131ml\u0131 de\u011fil' }, { status: 500 })
  }

  let body: AiScanRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ge\u00e7ersiz istek g\u00f6vdesi' }, { status: 400 })
  }

  if (!body?.columns || !Array.isArray(body.columns)) {
    return NextResponse.json({ error: 'columns alan\u0131 zorunlu' }, { status: 400 })
  }

  const columnsText = body.columns
    .map(col => `Kolon ${col.index} (ba\u015fl\u0131k: "${col.header}"): ${col.samples.join(', ')}`)
    .join('\n')

  const prompt = `A\u015fa\u011f\u0131daki Excel s\u00fctunlar\u0131n\u0131 analiz et. Her s\u00fctun i\u00e7in i\u00e7eri\u011fin ki\u015fi ad\u0131 (PERSON), firma/\u015firket ad\u0131 (ORG) veya di\u011fer (OTHER) oldu\u011funu belirle.\n\nS\u00fctunlar:\n${columnsText}\n\nSadece JSON d\u00f6nd\u00fcr, ba\u015fka hi\u00e7bir \u015fey yazma:\n{"columns":[{"index":0,"type":"PERSON veya ORG veya OTHER","confidence":"high veya medium veya low"}]}`

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'Model yan\u0131t vermedi' }, { status: 500 })
    }

    const raw = textContent.text.trim()
    const parsed: AiScanResponse = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
