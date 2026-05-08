# Excel Anonymizer 🛡️

[English](#english) | [Türkçe](#türkçe)

---

<a name="english"></a>
## English

**Excel Anonymizer** is a privacy-first, bilingual tool designed to safely anonymize personal and company names in Excel (`.xlsx`, `.xls`) files. It uses precision ZIP-level patching to replace sensitive data while preserving 100% of the workbook's formatting, formulas, styles, and charts.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

### ✨ Key Features

-   **🎯 Precision Anonymization**: Replaces text directly in the workbook's XML structure (`xl/*.xml`), ensuring that only the specific values are changed.
-   **🎨 Format Preservation**: Unlike tools that export to CSV or recreate sheets, this tool maintains your original cell styles, formulas, merged cells, themes, and chart references bit-for-bit.
-   **🤖 AI-Powered Detection**: One-click scanning of all tabs using Claude (Anthropic AI) to automatically identify columns containing names (`PERSON`) or organizations (`ORG`).
-   **🌍 Fully Bilingual**: Toggle between **English** and **Turkish** interfaces instantly.
-   **🔑 Reversibility**: Generates a secure `mapping_*.json` file along with the anonymized Excel file, allowing you to restore the original values whenever needed.
-   **💻 Client-Side processing**: The heavy lifting (Excel manipulation) happens entirely in your browser. Your sensitive files never leave your device.

---

### 🚀 Getting Started

#### 1. Prerequisites
-   Node.js 20+
-   An Anthropic API Key (for AI scanning)

#### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/maymun207/excel-anonymizer.git
cd excel-anonymizer
npm install
```

#### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

#### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start anonymizing.

---

### 📖 How to Use

#### Anonymizing a File
1.  **Upload**: Drag and drop your `.xlsx` file into the "Anonymize" tab.
2.  **Scan**: Use the **"AI Scan"** button to automatically detect columns, or manually click column headers to toggle between `PERSON` and `ORG` types.
3.  **Process**: Click **"Anonymize File"**.
4.  **Download**: You will receive two files:
    -   `anon_[filename].xlsx`: The privacy-cleansed workbook.
    -   `mapping_[filename].json`: The key required to restore the data.

#### Restoring a File (Deanonymize)
1.  Switch to the **"Restore Data"** tab.
2.  Upload the **Anonymized Excel file**.
3.  Upload the corresponding **Mapping JSON file**.
4.  Click **"Restore Original Data"** to download the original workbook.

---

### 🛠️ Technology Stack

-   **Frontend**: Next.js 15 (App Router), React 19
-   **Styling**: Tailwind CSS v4 (Zinc/Blue theme)
-   **Excel Engine**: [SheetJS (xlsx)](https://sheetjs.com/) for parsing and [JSZip](https://stuk.github.io/jszip/) for precision XML patching.
-   **AI Integration**: Anthropic SDK (Claude 3.5 Sonnet)

---

### 🔒 Privacy & Security

-   **Zero Uploads**: The Excel files are parsed and modified locally in the browser using Web Workers/Client-side JS.
-   **Minimal Metadata**: Only small text samples (max 10 per column) are sent to the AI API for column type detection if you choose to use the "AI Scan" feature.
-   **Mapping File**: The restoration key is generated on your machine and only you hold the file needed to "unmask" the data.

---

<a name="türkçe"></a>
## Türkçe

**Excel Anonimize Edici**, Excel (`.xlsx`, `.xls`) dosyalarındaki kişisel ve şirket isimlerini güvenli bir şekilde anonimize etmek için tasarlanmış, gizlilik odaklı ve çift dilli bir araçtır. Hassas verileri değiştirirken çalışma kitabının biçimlendirmesini, formüllerini, stillerini ve grafiklerini %100 korumak için hassas ZIP düzeyinde yamalama kullanır.

### ✨ Temel Özellikler

-   **🎯 Hassas Anonimleştirme**: Metni doğrudan çalışma kitabının XML yapısında (`xl/*.xml`) değiştirerek yalnızca belirli değerlerin değişmesini sağlar.
-   **🎨 Biçim Koruma**: CSV'ye aktaran veya sayfaları yeniden oluşturan araçların aksine, bu araç orijinal hücre stillerinizi, formüllerinizi, birleştirilmiş hücrelerinizi, temalarınızı ve grafik referanslarınızı bit-bit korur.
-   **🤖 Yapay Zeka Destekli Tespit**: İsimleri (`KİŞİ`) veya kuruluşları (`KURUM`) otomatik olarak tanımlamak için Claude (Anthropic AI) kullanarak tüm sekmeleri tek tıklamayla tarar.
-   **🌍 Tamamen Çift Dilli**: İngilizce ve Türkçe arayüzler arasında anında geçiş yapın.
-   **🔑 Geri Döndürülebilirlik**: Anonimleştirilmiş Excel dosyasıyla birlikte güvenli bir `mapping_*.json` dosyası oluşturur ve ihtiyacınız olduğunda orijinal değerleri geri yüklemenize olanak tanır.
-   **💻 İstemci Tarafı İşleme**: Ağır işler (Excel manipülasyonu) tamamen tarayıcınızda gerçekleşir. Hassas dosyalarınız asla cihazınızdan ayrılmaz.

---

### 🚀 Başlarken

#### 1. Gereksinimler
-   Node.js 20+
-   Anthropic API Anahtarı (Yapay zeka taraması için)

#### 2. Kurulum

Depoyu klonlayın ve bağımlılıkları yükleyin:

```bash
git clone https://github.com/maymun207/excel-anonymizer.git
cd excel-anonymizer
npm install
```

#### 3. Ortam Kurulumu

Kök dizinde bir `.env.local` dosyası oluşturun:

```env
ANTHROPIC_API_KEY=api_anahtariniz_buraya
```

#### 4. Geliştirme Sunucusunu Çalıştırın

```bash
npm run dev
```

Anonimleştirmeye başlamak için [http://localhost:3000](http://localhost:3000) adresini ziyaret edin.

---

### 📖 Nasıl Kullanılır?

#### Bir Dosyayı Anonimleştirme
1.  **Yükle**: `.xlsx` dosyanızı "Anonimize Et" sekmesine sürükleyip bırakın.
2.  **Tara**: Sütunları otomatik olarak tespit etmek için **"AI Tara"** butonunu kullanın veya sütun türlerini `KİŞİ` ve `KURUM` arasında manuel olarak değiştirmek için sütun başlıklarına tıklayın.
3.  **İşle**: **"Dosyayı Anonimize Et"** butonuna tıklayın.
4.  **İndir**: İki dosya alacaksınız:
    -   `anon_[dosya_adi].xlsx`: Gizliliği temizlenmiş çalışma kitabı.
    -   `mapping_[dosya_adi].json`: Verileri geri yüklemek için gereken anahtar.

#### Bir Dosyayı Geri Yükleme (Deanonymize)
1.  **"Verileri Geri Yükle"** sekmesine geçin.
2.  **Anonimleştirilmiş Excel dosyasını** yükleyin.
3.  İlgili **Eşleme JSON dosyasını** yükleyin.
4.  Orijinal çalışma kitabını indirmek için **"Orijinal Verileri Geri Yükle"** butonuna tıklayın.

---

### 🛠️ Teknoloji Yığını

-   **Frontend**: Next.js 15 (App Router), React 19
-   **Stil**: Tailwind CSS v4 (Zinc/Mavi tema)
-   **Excel Motoru**: Ayrıştırma için [SheetJS (xlsx)](https://sheetjs.com/) ve hassas XML yamalama için [JSZip](https://stuk.github.io/jszip/).
-   **Yapay Zeka Entegrasyonu**: Anthropic SDK (Claude 3.5 Sonnet)

---

### 🔒 Gizlilik ve Güvenlik

-   **Sıfır Yükleme**: Excel dosyaları, Web Worker'lar/İstemci tarafı JS kullanılarak tarayıcıda yerel olarak ayrıştırılır ve değiştirilir.
-   **Minimum Meta Veri**: "AI Tara" özelliğini kullanmayı seçerseniz, sütun türü tespiti için yapay zeka API'sine yalnızca küçük metin örnekleri (sütun başına en fazla 10) gönderilir.
-   **Eşleme Dosyası**: Geri yükleme anahtarı makinenizde oluşturulur ve verilerin "maskesini kaldırmak" için gereken dosyaya yalnızca siz sahip olursunuz.

---

### 📄 Lisans

Bu proje açık kaynaklıdır ve **Apache Lisansı 2.0** altında sunulmaktadır. Kullanmakta, değiştirmekte ve dağıtmakta özgürsünüz.

---
*Güvenli veri işleme için ❤️ ile geliştirildi.*
