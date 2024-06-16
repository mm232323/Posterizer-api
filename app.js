const bodyparser = require('body-parser')

const express = require('express')

const app = express()


app.use((req,res,next) => {
 console.log('hello')
})

app.listen(8080)