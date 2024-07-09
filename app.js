const bodyparser = require('body-parser')

const express = require('express')
const mainRoutes = require('./routes/main')
const userRoutes = require('./routes/user')
const app = express()

app.use(bodyparser.urlencoded({extended:true}))

app.use(express.json())

app.use('/',mainRoutes)
app.use('/',userRoutes)

app.listen(8080)