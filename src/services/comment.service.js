const prisma = require('../../prisma/client');

/**
 * Get all comments for an article
 */
const getByArticleId = async (articleId) => {
    const id = parseInt(articleId);
    if (isNaN(id)) {
        const error = new Error('Invalid article ID');
        error.statusCode = 400;
        throw error;
    }

    return await prisma.comment.findMany({
        where: { articleId: id },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            content: true,
            createdAt: true,
            articleId: true,
        },
    });
};

/**
 * Create a new comment
 */
const create = async ({ articleId, name, content }) => {
    const id = parseInt(articleId);
    if (isNaN(id)) {
        const error = new Error('Invalid article ID');
        error.statusCode = 400;
        throw error;
    }

    if (!name || !name.trim()) {
        const error = new Error('Name is required');
        error.statusCode = 400;
        throw error;
    }

    if (!content || !content.trim()) {
        const error = new Error('Content is required');
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

    return await prisma.comment.create({
        data: {
            articleId: id,
            name: name.trim(),
            content: content.trim(),
        },
        select: {
            id: true,
            name: true,
            content: true,
            createdAt: true,
            articleId: true,
        },
    });
};

module.exports = { getByArticleId, create };
