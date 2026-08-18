const prisma = require('../../prisma/client');

const getAll = async ({ page = 1, limit = 10, search, category, sort }) => {
    // Konversi ke integer karena query params selalu berupa string
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // Bangun filter secara dinamis
    const where = {};

    if (search) {
        where.title = {
            contains: search,
        };
    }

    if (category) {
        where.category = {
            slug: category,
        };
    }

    // Tentukan sort order
    const orderBy = sort === 'oldest'
        ? { publishedAt: 'asc' }
        : { publishedAt: 'desc' };

    // Jalankan kedua query secara paralel
    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            skip,
            take: limitInt,
            orderBy,
            select: {
                id: true,
                title: true,
                author: true,
                slug: true,
                thumbnail: true,
                publishedAt: true,
                category: {
                    select: {
                        name: true,
                        slug: true,
                    },
                },
                _count: {
                    select: { likes: true },
                },
            },
        }),
        prisma.article.count({ where }),
    ]);

    // Transform _count.likes into a flat `likes` field
    const articlesWithLikes = articles.map((article) => ({
        ...article,
        likes: article._count.likes,
        _count: undefined,
    }));

    return {
        articles: articlesWithLikes,
        meta: {
            total,
            page: pageInt,
            limit: limitInt,
            totalPages: Math.ceil(total / limitInt),
        },
    };
};

const getBySlug = async (slug) => {
    const article = await prisma.article.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            author: true,
            slug: true,
            content: true,
            thumbnail: true,
            publishedAt: true,
            category: {
                select: {
                    name: true,
                    slug: true,
                },
            },
            _count: {
                select: { likes: true },
            },
        },
    });

    if (!article) {
        const error = new Error('Article not found');
        error.statusCode = 404;
        throw error;
    }

    // Transform _count.likes into flat `likes` field
    return {
        ...article,
        likes: article._count.likes,
        _count: undefined,
    };
};

module.exports = { getAll, getBySlug };
