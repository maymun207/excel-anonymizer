import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Use environment variable for domain, or fallback to a default
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://excel-anonymizer.com'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
