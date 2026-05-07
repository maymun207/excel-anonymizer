import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { AiScanRequest, AiScanResponse } from '@/lib/types'

// ---------------------------------------------------------------------------
// System prompt — tells the model WHO it is and HOW to respond
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `Sen bir veri anonimleştirme uzmanısın. Görevin, bir Excel tablosundaki sütunları analiz ederek hangi sütunların kişi adı (PERSON), firma/kuruluş adı (ORG) veya başka veri türü (OTHER) içerdiğini tespit etmektir.

## Sınıflandırma Kuralları

### PERSON — Gerçek kişi adları
- Türkçe ad-soyad kalıpları: "Ahmet Yılmaz", "Fatma Kaya", "Mehmet Ali Demir"
- **Tek hücrede tam ad:** "Ortaç Serdar", "Yüksel Cem", "Süleyman Soysal" — iki kelimeden oluşan ve her iki kelime de büyük harfle başlıyorsa, büyük olasılıkla kişi adıdır
- Yabancı isimler: "John Smith", "Hans Müller"
- Tek isim de olabilir: "Ahmet", "Fatma" (eğer sütundaki diğer örnekler de isimse)
- Unvan + isim: "Dr. Ahmet Kaya", "Av. Zeynep Demir"
- Türkçe özel karakterler (ç, ş, ğ, ü, ö, ı, İ) isim olma olasılığını ARTTIRIR, azaltmaz

### ORG — Firma, şirket, kuruluş adları
- Şirket isimleri: "Arçelik A.Ş.", "Türk Telekom", "Koç Holding"
- LTD, A.Ş., INC, LLC gibi son ekler güçlü sinyaldir
- Kuruluşlar: "Kızılay", "TÜBİTAK", "İstanbul Üniversitesi"
- Marka isimleri: "Apple", "Google", "Vestel"
- 2-4 harfli tamamen büyük harf kısaltmalar (ACT, ABC, XYZ) firma kısaltması olabilir

### OTHER — Aşağıdakiler kesinlikle PERSON veya ORG DEĞİLDİR
- Tarihler, sayılar, para birimleri, yüzdeler
- Adresler, şehir isimleri, ülke isimleri (bunlar konum verisidir, kişi değil)
- E-posta adresleri, telefon numaraları
- Ürün kodları, seri numaları, sipariş numaraları
- Durum değerleri: "Aktif", "Pasif", "Onaylandı", "Beklemede"
- Açıklama/yorum metinleri
- Departman isimleri: "Muhasebe", "İnsan Kaynakları" (bunlar ORG değildir)
- Pozisyon/ünvan: "Müdür", "Uzman", "Mühendis" (bunlar PERSON değildir)
- "Diğer", "Toplam", "Genel" gibi genel kategori etiketleri

## Karar Verme Stratejisi
1. **VERİ KALIPLARINI BAŞLIKLARDAN ÖNCELİKLİ TUT:** Sütun başlığı finansal, muhasebe veya teknik bir terim olabilir (örn: "Ortaklara Borçlar", "Alacaklar", "Cari Hesap") ama sütundaki GERÇEK DEĞERLER kişi adı kalıbına uyuyorsa → PERSON olarak işaretle. Başlık yanıltıcı olabilir çünkü Türk muhasebe tablolarında borç/alacak sütunlarında ortak/müşteri İSİMLERİ listelenir.
2. Başlık boşsa veya yoksa, YALNIZCA örnek değerlere göre karar ver
3. ÖRNEK DEĞERLERİ tek tek incele — çoğunluk bir kalıba uyuyorsa o tipe ata
4. **BİTİŞİK SÜTUNLAR önemlidir:** Türk Excel dosyalarında ad ve soyad genellikle YAN YANA iki sütunda tutulur. Bir sütun kişi adı gibi görünüyorsa, hemen yanındaki sütun da büyük olasılıkla kişi adıdır (biri ad, diğeri soyad). Her iki sütunu da PERSON olarak işaretle.
5. Kısa, tek kelimelik metinler içeren sütunlar (sayı veya tarih olmayan) potansiyel isim sütunlarıdır — özellikle yanlarındaki sütun zaten PERSON ise
6. Alışılmadık veya tanımadığın kelimeler de isim olabilir — Türkçe'de çok çeşitli isimler vardır. Bir kelimenin sözlük anlamı olması onu isim olmaktan çıkarmaz (örn: "Deniz", "Çağla", "Işık", "Bulut", "Yüksel", "Ortaç" hepsi gerçek isimlerdir)
7. Emin değilsen ama sütundaki değerler kısa metin (1-3 kelime) ve sayı/tarih değilse, PERSON olarak işaretle ve confidence: "medium" ver
8. **KARIŞIK SÜTUNLAR:** Bir sütunda hem isimler hem isim olmayan değerler varsa (örn: "Ortaç Serdar", "Yüksel Cem", "ACT", "Diğer"), çoğunluk isimse → PERSON olarak işaretle. "Diğer", "Toplam" gibi genel etiketler bir sütunun isim sütunu olmadığı anlamına gelmez — bunlar sadece özet satırlarıdır.

## Çıktı Formatı
Yalnızca geçerli JSON döndür. Markdown kullanma, açıklama yazma, hiçbir ek metin ekleme.
JSON şeması:
{"columns":[{"index":<sütun_numarası>,"type":"PERSON"|"ORG"|"OTHER","confidence":"high"|"medium"|"low"}]}`

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

  // Build a clear, structured representation of each column
  const columnsText = body.columns
    .map(col => {
      const samplesFormatted = col.samples
        .map((s, i) => `  ${i + 1}. "${s}"`)
        .join('\n')
      return `--- Sütun ${col.index} ---\nBaşlık: "${col.header}"\nÖrnek değerler:\n${samplesFormatted}`
    })
    .join('\n\n')

  const userPrompt = `Aşağıdaki Excel sayfasının ("${body.sheetName}") sütunlarını analiz et ve her birini PERSON, ORG veya OTHER olarak sınıflandır.

${columnsText}

Yanıtını SADECE JSON olarak ver.`

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'Model yanıt vermedi' }, { status: 500 })
    }

    // Strip markdown code fences if the model wraps the response
    let stripped = textContent.text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    // Attempt to recover truncated JSON (e.g. model hit max_tokens)
    let parsed: AiScanResponse
    try {
      parsed = JSON.parse(stripped)
    } catch {
      // Try closing open brackets/braces
      const openBraces = (stripped.match(/{/g) || []).length - (stripped.match(/}/g) || []).length
      const openBrackets = (stripped.match(/\[/g) || []).length - (stripped.match(/]/g) || []).length
      // Remove trailing comma if present
      stripped = stripped.replace(/,\s*$/, '')
      stripped += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces))
      parsed = JSON.parse(stripped)
    }

    // Validate structure before returning
    if (!parsed?.columns || !Array.isArray(parsed.columns)) {
      return NextResponse.json({ error: 'Model geçersiz format döndürdü' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
