const express = require("express");

const router = express.Router();

const db = require("../util/db/database");

const main = async () => {
  try {
    await db.connectToDB();
    console.log("seccussful connected to posterizer databasein main page");
  } catch (err) {
    console.log("connecting filled");
  }
};
main();

const messagesCollection = db.client.db("posterizer").collection("messages");
const usersCollection = db.client.db("posterizer").collection("users");
const sessionsCollection = db.client.db("posterizer").collection("sessions");

router.post("/contact/add-message", (req, res, next) => {
  const message = req.body;
  messagesCollection.insertOne(message);
  res.redirect("/contact");
  return "THE MESSAGE ADDED";
});

router.post("/signup/create-user", async (req, res, next) => {
  const user = req.body
  console.log(user)
  usersCollection.insertOne(user);
  res.redirect("/signup");
  return "THE MESSAGE ADDED";
});

router.post("/login/check-user",async (req,res,next) => {
  const user = req.body
  let result = await usersCollection.findOne(user)
  res.json(JSON.stringify({isVerified:result}))
})

router.post("/signin/create-session",async(req,res,next) => {
  const session = req.body
  sessionsCollection.insertOne(session)
  res.redirect('signin')
})

module.exports = router;
