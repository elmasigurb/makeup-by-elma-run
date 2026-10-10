import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import seo from '../../data/seo.json'

interface SeoPage {
  path: string
  title: string
  description: string
  heading: string
  summary: string
  index: boolean
}

const pages = seo.pages as SeoPage[]

export function PageMetadata() {
  const { pathname } = useLocation()

  useEffect(() => {
    const normalizedPath = normalizePath(pathname)
    const page = pages.find((entry) => entry.path === normalizedPath)
    const isPrivate = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')
    const title = page?.title ?? (isPrivate ? `Admin | ${seo.siteName}` : `Page not found | ${seo.siteName}`)
    const description = page?.description ?? 'Makeup by Elma Rún.'
    const canonicalUrl = page ? new URL(page.path, `${seo.siteUrl}/`).toString() : null
    const imageUrl = new URL(seo.defaultImage, `${seo.siteUrl}/`).toString()
    const robots = page?.index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow, noarchive'

    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', robots)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', seo.siteName)
    setMeta('property', 'og:locale', seo.locale)
    setMeta('property', 'og:image', imageUrl)
    setMeta('property', 'og:image:secure_url', imageUrl)
    setMeta('property', 'og:image:type', 'image/png')
    setMeta('property', 'og:image:width', '1200')
    setMeta('property', 'og:image:height', '630')
    setMeta('property', 'og:image:alt', seo.defaultImageAlt)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', imageUrl)
    setMeta('name', 'twitter:image:alt', seo.defaultImageAlt)

    if (page && canonicalUrl) {
      setCanonical(canonicalUrl)
      setMeta('property', 'og:url', canonicalUrl)
      setStructuredData({
        '@context': 'https://schema.org',
        '@type': page.path === '/' ? 'WebSite' : 'WebPage',
        name: page.title,
        description: page.description,
        url: canonicalUrl,
        isPartOf: page.path === '/' ? undefined : { '@type': 'WebSite', name: seo.siteName, url: `${seo.siteUrl}/` },
      })
    } else {
      document.querySelector('link[rel="canonical"]')?.remove()
      document.querySelector('meta[property="og:url"]')?.remove()
      document.querySelector('#seo-structured-data')?.remove()
    }
  }, [pathname])

  return null
}

function normalizePath(pathname: string) {
  if (pathname === '/') return '/'
  return pathname.replace(/\/+$/, '')
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.append(element)
  }
  element.href = href
}

function setStructuredData(value: Record<string, unknown>) {
  let element = document.head.querySelector<HTMLScriptElement>('#seo-structured-data')
  if (!element) {
    element = document.createElement('script')
    element.type = 'application/ld+json'
    element.id = 'seo-structured-data'
    document.head.append(element)
  }
  element.textContent = JSON.stringify(value)
}
