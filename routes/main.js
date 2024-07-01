const express = require('express')

const router = express.Router()

const db = require('../util/db/database')

const main = async () => {
 try {
  await db.connectToDB()
  console.log('seccussful connected to posterizer database')
 }
 catch (err) {
  console.log("connecting filled")
 }
}
main()

const messagesCollection = db.client.db('posterizer').collection("messages")

router.post('/contact/add-message',(req,res,next) => {
 const message = req.body
 messagesCollection.insertOne(message)
 res.redirect('/contact')
 return 'THE MESSAGE ADDED'
})

module.exports = router