const prisma = require('../../prisma/client');

/**
 * Toggle like on an article.
 * Uses IP-based deduplication: one like per IP per article.
 * Returns the total like count after the operation.
 */
const toggleLike = async (articleId, ip) => {
    const id = parseInt(articleId);
    if (isNaN(id)) {
        const error = new Error('Invalid article ID');
        error.statusCode = 400;
        throw error;
    }

    // Verify article exists
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
        const error = new Error('Article not found');
        error.statusCode = 404;
        throw error;
    }

    const clientIp = ip || 'anonymous';

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
        where: {
            articleId_ip: {
                articleId: id,
                ip: clientIp,
            },
        },
    });

    if (existingLike) {
        // Already liked — just return current count (idempotent)
        const count = await prisma.like.count({ where: { articleId: id } });
        return { likes: count, alreadyLiked: true };
    }

    // Create new like
    await prisma.like.create({
        data: {
            articleId: id,
            ip: clientIp,
        },
    });

    const count = await prisma.like.count({ where: { articleId: id } });
    return { likes: count, alreadyLiked: false };
};

/**
 * Get like count for an article
 */
const getCount = async (articleId) => {
    const id = parseInt(articleId);
    if (isNaN(id)) return 0;

    return await prisma.like.count({ where: { articleId: id } });
};

module.exports = { toggleLike, getCount };
