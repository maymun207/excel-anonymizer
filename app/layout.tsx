import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { LanguageProvider } from "@/hooks/useLanguage";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Excel Anonymizer | AI-Powered Data Privacy',
    template: '%s | Excel Anonymizer'
  },
  description: 'Safely anonymize and de-anonymize personal (KVKK/GDPR) and company names in Excel files using AI. 100% format preservation.',
  keywords: ['Excel', 'Anonymization', 'KVKK', 'GDPR', 'Data Privacy', 'AI', 'Claude', 'Data Masking'],
  authors: [{ name: 'Excel Anonymizer Team' }],
  creator: 'Excel Anonymizer',
  publisher: 'Excel Anonymizer',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Excel Anonymizer | AI-Powered Data Privacy',
    description: 'Safely anonymize personal and company names in Excel files with zero formatting loss.',
    url: 'https://excel-anonymizer.com',
    siteName: 'Excel Anonymizer',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Excel Anonymizer | AI-Powered Data Privacy',
    description: 'Safely anonymize personal and company names in Excel files with zero formatting loss.',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Excel Anonymizer",
  "description": "Safely anonymize and de-anonymize personal (KVKK/GDPR) and company names in Excel files using AI. 100% format preservation.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "AI-powered column classification",
    "Zero data format loss",
    "Zip-level XML patching",
    "Deanonymization support"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* JSON-LD Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider>{children}</LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
