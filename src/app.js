const express = require('express')
const cors = require('cors')
const errorHandler = require('./middlewares/errorHandler')
const routes = require('./routes/index')
const app = express()



app.use(cors())
app.use(express.json())
app.use('/api', routes)

// tangkap route yang tidak dikenal
app.use((req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`)
    error.statusCode = 404;
    next(error)
})

app.use(errorHandler)


module.exports = app
