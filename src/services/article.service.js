const prisma = require('../../prisma/client');

const getAll = async ({ page = 1, limit = 10, search, category }) => {
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

    // Jalankan kedua query secara paralel
    const [articles, total] = await Promise.all([
        prisma.article.findMany({
            where,
            skip,
            take: limitInt,
            orderBy: { publishedAt: 'desc' },
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
            },
        }),
        prisma.article.count({ where }),
    ]);

    return {
        articles,
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
        },
    });

    if (!article) {
        const error = new Error('Article not found');
        error.statusCode = 404;
        throw error;
    }

    return article;
};

module.exports = { getAll, getBySlug };
