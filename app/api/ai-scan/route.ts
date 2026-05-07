import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { AiScanRequest, AiScanResponse } from '@/lib/types'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY tanımlı değil' }, { status: 500 })
  }

  let body: AiScanRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
  }

  if (!body?.columns || !Array.isArray(body.columns)) {
    return NextResponse.json({ error: 'columns alanı zorunlu' }, { status: 400 })
  }

  const columnsText = body.columns
    .map(col => `Kolon ${col.index} (başlık: "${col.header}"): ${col.samples.join(', ')}`)
    .join('\n')

  const prompt = `Aşağıdaki Excel sütunlarını analiz et. Her sütun için içeriğin kişi adı (PERSON), firma/şirket adı (ORG) veya diğer (OTHER) olduğunu belirle.

Sütunlar:
${columnsText}

Sadece JSON döndür, başka hiçbir şey yazma:
{"columns":[{"index":0,"type":"PERSON veya ORG veya OTHER","confidence":"high veya medium veya low"}]}`

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'Model yanıt vermedi' }, { status: 500 })
    }

    const raw = textContent.text.trim()
    const parsed: AiScanResponse = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
