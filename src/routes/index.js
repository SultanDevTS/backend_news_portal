const express = require('express');
const router = express.Router();
const categoryRoutes = require('./category.route')
const articleRoutes = require('./article.route')



// Category routes
router.use('/categories', categoryRoutes);

// Article routes
router.use('/articles', articleRoutes);


module.exports = router;