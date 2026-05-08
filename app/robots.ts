import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://excel-anonymizer.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'], // API route'larını indekslemeye gerek yok
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
