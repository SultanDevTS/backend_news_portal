// 
const categoryServices = require('../services/category.service');
const { successResponse } = require('../utils/responseFormatter')


const getAll = async (req, res, next) => {
    try {
        const categories = await categoryServices.getAll();
        return successResponse(res, categories);
    } catch (error) {
        next(error);
    }
};

const getBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const category = await categoryServices.getBySlug(slug);
        return successResponse(res, category);
    } catch (error) {
        next(error)
    }
};

module.exports = { getAll, getBySlug }
