const express = require('express');
const router = express.Router();
const categoryRoutes = require('./category.route');
const articleRoutes = require('./article.route');
const commentRoutes = require('./comment.route');

// Category routes
router.use('/categories', categoryRoutes);

// Article routes
router.use('/articles', articleRoutes);

// Comment routes
router.use('/comments', commentRoutes);

module.exports = router;