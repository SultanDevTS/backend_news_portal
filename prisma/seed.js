const { PrismaClient } = require('../generated/prisma')

const prisma = new PrismaClient()

// ──────────────────────────────────────────────
// Berita Indo API (satyawikananda/berita-indo-api)
// Base URL: https://berita-indo-api.vercel.app
// Free, no API key required – parses RSS feeds to JSON
// ──────────────────────────────────────────────

const BASE_URL = 'https://berita-indo-api.vercel.app/v1'

// Each news source maps to a set of category slugs.
// We pick a diverse mix from CNN and CNBC to get well-categorised data.
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

/**
 * Fetches news articles from the Berita Indo API for a given source and category.
 *
 * @param {string} source - e.g. 'cnn-news'
 * @param {string} category - e.g. 'nasional'
 * @returns {Promise<Array>} Array of article objects from the API
 */
async function fetchNews(source, category) {
    const url = `${BASE_URL}/${source}/${category}`
    console.log(`   📡 Fetching: ${url}`)

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

/**
 * Turns a title string into a URL-friendly slug.
 * Handles Indonesian / unicode characters gracefully.
 */
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')   // strip non-word chars (except spaces & dashes)
        .replace(/[\s_]+/g, '-')    // collapse whitespace / underscores → dash
        .replace(/^-+|-+$/g, '')    // trim leading/trailing dashes
        .substring(0, 190)          // keep under MySQL VARCHAR(191) limit
}

async function main() {
    console.log('🌱 Starting seed – scraping Indonesian news...\n')

    // ── 1. Clear existing data (respect FK: likes/comments → articles → categories) ──
    await prisma.like.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.article.deleteMany()
    await prisma.category.deleteMany()
    console.log('🗑️  Cleared existing likes, comments, articles & categories\n')

    // ── 2. Collect unique categories and create them ──
    const categoryMap = new Map() // slug → name

    for (const src of NEWS_SOURCES) {
        for (const cat of src.categories) {
            if (!categoryMap.has(cat.slug)) {
                categoryMap.set(cat.slug, cat.name)
            }
        }
    }

    // Bulk-create categories
    const categoryRecords = []
    for (const [slug, name] of categoryMap) {
        const created = await prisma.category.create({
            data: { name, slug },
        })
        categoryRecords.push(created)
        console.log(`   ✅ Category: ${name} (${slug})`)
    }

    // Build a lookup: slug → category id
    const slugToId = {}
    for (const c of categoryRecords) {
        slugToId[c.slug] = c.id
    }
    console.log(`\n📂 Created ${categoryRecords.length} categories\n`)

    // ── 3. Fetch articles per source/category and save to DB ──
    let totalSaved = 0
    const seenSlugs = new Set() // avoid duplicate slugs

    for (const src of NEWS_SOURCES) {
        console.log(`\n📰 Source: ${src.source}`)
        console.log('─'.repeat(40))

        for (const cat of src.categories) {
            const articles = await fetchNews(src.source, cat.slug)
            const categoryId = slugToId[cat.slug]

            if (!categoryId) {
                console.warn(`   ⚠️  No category id for "${cat.slug}" – skipping`)
                continue
            }

            // Take up to 10 articles per category to keep seeds reasonable
            const batch = articles.slice(0, 10)
            let savedInBatch = 0

            for (const article of batch) {
                // Validate required fields
                if (!article.title || !article.contentSnippet) continue

                const articleSlug = slugify(article.title)
                if (!articleSlug || seenSlugs.has(articleSlug)) continue
                seenSlugs.add(articleSlug)

                const publishedAt = article.isoDate
                    ? new Date(article.isoDate)
                    : new Date()

                // Pick thumbnail safely if available
                const rawImg = article.image?.large || article.image?.small || article.image
                const thumbnail = typeof rawImg === 'string' ? rawImg : null

                try {
                    await prisma.article.create({
                        data: {
                            title: article.title,
                            author: `${src.source.replace('-news', '').toUpperCase()} Indonesia`,
                            slug: articleSlug,
                            content: article.contentSnippet,
                            thumbnail,
                            categoryId,
                            publishedAt,
                        },
                    })
                    savedInBatch++
                    totalSaved++
                } catch (err) {
                    // Unique constraint or other DB error – skip silently
                    if (err.code === 'P2002') {
                        // duplicate slug – just skip
                    } else {
                        console.warn(`   ⚠️  DB error for "${article.title}":`, err.message)
                    }
                }
            }

            console.log(
                `   📰 ${cat.name}: fetched ${articles.length}, saved ${savedInBatch}`,
            )
        }
    }

    console.log(`\n✅ Seeding complete – ${totalSaved} articles saved to database`)
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error('❌ SEED ERROR:', e)
        await prisma.$disconnect()
        process.exit(1)
    })