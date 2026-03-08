const prisma = require('../../prisma/client');

const getAll = async () => {
    return await prisma.category.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true
        },
    });
};

const getBySlug = async (slug) => {
    return await prisma.category.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true
        },
    });
    if (!category) {
        const error = new Error('Category not found')
        error.statusCode = 404;
        throw error;
    }

    return category

};

module.exports = { getAll, getBySlug }
