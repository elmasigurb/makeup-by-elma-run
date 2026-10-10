import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const config = JSON.parse(await readFile(join(root, 'src/data/seo.json'), 'utf8'))
const template = await readFile(join(dist, 'index.html'), 'utf8')

if (!template.includes('<!-- seo:head:start -->') || !template.includes('<!-- seo:fallback:start -->')) {
  throw new Error('SEO build markers are missing from the Vite output.')
}

for (const page of config.pages) {
  const canonicalUrl = new URL(page.path, `${config.siteUrl}/`).toString()
  const imageUrl = new URL(config.defaultImage, `${config.siteUrl}/`).toString()
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': page.path === '/' ? 'WebSite' : 'WebPage',
    name: page.title,
    description: page.description,
    url: canonicalUrl,
    ...(page.path === '/' ? {} : { isPartOf: { '@type': 'WebSite', name: config.siteName, url: `${config.siteUrl}/` } }),
  }
  const head = `<!-- seo:head:start -->
    <meta name="description" content="${escapeAttribute(page.description)}" />
    <meta name="robots" content="${page.index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow, noarchive'}" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeAttribute(config.siteName)}" />
    <meta property="og:locale" content="${escapeAttribute(config.locale)}" />
    <meta property="og:title" content="${escapeAttribute(page.title)}" />
    <meta property="og:description" content="${escapeAttribute(page.description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeAttribute(imageUrl)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttribute(config.defaultImageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(page.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(page.description)}" />
    <meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeAttribute(config.defaultImageAlt)}" />
    <script type="application/ld+json" id="seo-structured-data">${safeJson(structuredData)}</script>
    <title>${escapeHtml(page.title)}</title>
    <!-- seo:head:end -->`
  const fallback = `<!-- seo:fallback:start --><main><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.summary)}</p><nav aria-label="Public pages"><a href="/portfolio">Portfolio</a> <a href="/about">About</a> <a href="/services">Services &amp; Pricing</a> <a href="/contact">Contact &amp; Booking</a></nav></main><!-- seo:fallback:end -->`
  const html = template
    .replace(/<!-- seo:head:start -->[\s\S]*?<!-- seo:head:end -->/, head)
    .replace(/<!-- seo:fallback:start -->[\s\S]*?<!-- seo:fallback:end -->/, fallback)
  const output = page.path === '/' ? join(dist, 'index.html') : join(dist, `${page.path.slice(1)}.html`)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, html)
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('\n', ' ')
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}
