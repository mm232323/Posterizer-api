const bodyparser = require('body-parser')

const express = require('express')
const mainRoutes = require('./routes/main')
const app = express()

app.use(bodyparser.urlencoded({extended:true}))

app.use(express.json())

app.use('/',mainRoutes)

app.listen(8080)