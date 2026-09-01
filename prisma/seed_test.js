const { PrismaClient } = require('../generated/prisma')
const cheerio = require('cheerio')

const prisma = new PrismaClient()

const BASE_URL = 'https://berita-indo-api.vercel.app/v1'

const NEWS_SOURCES = [
    {
        source: 'cnn-news',
        categories: [
            { slug: 'nasional', name: 'Nasional' },
            { slug: 'internasional', name: 'Internasional' },
            { slug: 'ekonomi', name: 'Ekonomi' },
            { slug: 'olahraga', name: 'Olahraga' },
            { slug: 'teknologi', name: 'Teknologi' },
            { slug: 'hiburan', name: 'Hiburan' },
            { slug: 'gayahidup', name: 'Gaya Hidup' },
        ],
    },
    {
        source: 'cnbc-news',
        categories: [
            { slug: 'investment', name: 'Investment' },
            { slug: 'market', name: 'Market' },
            { slug: 'entrepreneur', name: 'Entrepreneur' },
            { slug: 'tech', name: 'Tech' },
            { slug: 'lifestyle', name: 'Lifestyle' },
        ],
    },
]

async function fetchNews(source, category) {
    const url = `${BASE_URL}/${source}/${category}`
    console.log(`   📡 Fetching list: ${url}`)

    try {
        const res = await fetch(url)
        if (!res.ok) {
            console.warn(`   ⚠️  HTTP ${res.status} for ${url} – skipping`)
            return []
        }
        const json = await res.json()
        if (json.code !== 200 || !Array.isArray(json.data)) {
            console.warn(`   ⚠️  Unexpected response for ${url} – skipping`)
            return []
        }
        return json.data
    } catch (err) {
        console.error(`   ❌ Error fetching ${url}:`, err.message)
        return []
    }
}

async function fetchArticleBody(articleUrl, fallbackSnippet) {
    if (!articleUrl) return fallbackSnippet

    try {
        const res = await fetch(articleUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        if (!res.ok) return fallbackSnippet

        const html = await res.text()
        const $ = cheerio.load(html)
        let paragraphs = []

        if (articleUrl.includes('cnnindonesia.com')) {
            $('.detail_text p').each((_, el) => {
                const text = $(el).text().trim()
                if (text && !text.includes('ADVERTISEMENT') && !text.includes('SCROLL TO RESUME')) {
                    paragraphs.push(text)
                }
            })
        } else if (articleUrl.includes('cnbcindonesia.com')) {
            $('.detail-text p').each((_, el) => {
                const text = $(el).text().trim()
                if (text && !text.includes('ADVERTISEMENT') && !text.includes('SCROLL TO RESUME')) {
                    paragraphs.push(text)
                }
            })
        }

        if (paragraphs.length === 0) {
            $('article p, .article-content p, .post-content p').each((_, el) => {
                const text = $(el).text().trim()
                if (text) paragraphs.push(text)
            })
        }

        if (paragraphs.length > 0) {
            return paragraphs.map(p => `<p>${p}</p>`).join('')
        }

        return fallbackSnippet
    } catch (err) {
        return fallbackSnippet
    }
}

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')   
        .replace(/[\s_]+/g, '-')    
        .replace(/^-+|-+$/g, '')    
        .substring(0, 190)          
}

async function main() {
    console.log('🌱 Starting incremental seed (Safe Mode: Old data preserved)...\n')

    // 🚫 HAPUS deleteMany() untuk artikel, like, dan comment agar data lama aman!
    // Kita hanya akan memastikan kategori tersedia menggunakan upsert.

    const categoryMap = new Map()
    for (const src of NEWS_SOURCES) {
        for (const cat of src.categories) {
            if (!categoryMap.has(cat.slug)) {
                categoryMap.set(cat.slug, cat.name)
            }
        }
    }

    // ── 1. Upsert Categories (Membuat jika belum ada, melewati jika sudah ada) ──
    const slugToId = {}
    for (const [slug, name] of categoryMap) {
        const category = await prisma.category.upsert({
            where: { slug },
            update: { name }, // Update nama jika ada perubahan
            create: { name, slug },
        })
        slugToId[slug] = category.id
        console.log(`   ✅ Category ready: ${name} (${slug})`)
    }
    console.log(`\n📂 Total categories handled: ${categoryMap.size}\n`)

    // ── 2. Fetch articles and use UPSERT to avoid duplicates and preserve old data ──
    let totalInsertedOrUpdated = 0

    for (const src of NEWS_SOURCES) {
        console.log(`\n📰 Source: ${src.source}`)
        console.log('─'.repeat(40))

        for (const cat of src.categories) {
            const articles = await fetchNews(src.source, cat.slug)
            const categoryId = slugToId[cat.slug]

            if (!categoryId) continue

            // Ubah angka slice jika ingin mengambil lebih banyak artikel per kategori (misal: 20)
            const batch = articles.slice(0, 15)
            let processedInBatch = 0

            for (const article of batch) {
                if (!article.title || !article.contentSnippet) continue

                const articleSlug = slugify(article.title)
                if (!articleSlug) continue

                const publishedAt = article.isoDate ? new Date(article.isoDate) : new Date()
                const rawImg = article.image?.large || article.image?.small || article.image
                const thumbnail = typeof rawImg === 'string' ? rawImg : null

                // Ambil full body content
                console.log(`   🔍 Processing: "${article.title.substring(0, 40)}..."`)
                const fullContent = await fetchArticleBody(article.link, article.contentSnippet)

                try {
                    // 💡 Menggunakan upsert: Jika slug sudah ada, update kontennya. Jika belum, buat baru.
                    await prisma.article.upsert({
                        where: { slug: articleSlug },
                        update: {
                            content: fullContent,
                            thumbnail: thumbnail || undefined,
                        },
                        create: {
                            title: article.title,
                            author: `${src.source.replace('-news', '').toUpperCase()} Indonesia`,
                            slug: articleSlug,
                            content: fullContent,
                            thumbnail,
                            categoryId,
                            publishedAt,
                        },
                    })
                    processedInBatch++
                    totalInsertedOrUpdated++
                } catch (err) {
                    console.warn(`   ⚠️  Error saving "${article.title}":`, err.message)
                }
            }

            console.log(`   📰 ${cat.name}: processed ${processedInBatch} articles`)
        }
    }

    console.log(`\n✅ Seeding complete – ${totalInsertedOrUpdated} articles processed safely without deleting old data!`)
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error('❌ SEED ERROR:', e)
        await prisma.$disconnect()
        process.exit(1)
    })