const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/Category.controller');

router.get('/', categoryController.getAll);
router.get('/:slug', categoryController.getBySlug);

module.exports = router