const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

router.get('/', categoryController.getAll);
router.get('/:slug', categoryController.getBySlug);

module.exports = router