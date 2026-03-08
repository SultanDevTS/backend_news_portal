const express = require('express')
const router = express.Router()
const articleController = require('../controllers/Article.controller');

router.get('/', articleController.getAll);
router.get('/:slug', articleController.getBySlug)

module.exports = router;