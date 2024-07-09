const express = require("express");

const router = express.Router();

const db = require("../util/db/database");

const main = async () => {
  try {
    await db.connectToDB();
    console.log("seccussful connected to posterizer database in user page");
  } catch (err) {
    console.log("connecting filled");
  }
};
main();

const usersCollection = db.client.db("posterizer").collection("users");
const sessionsCollection = db.client.db("posterizer").collection("sessions");

router.get("/profile/:Id", async (req, res, next) => {
  const id = req.params.Id;
  const selectedSession = await sessionsCollection.findOne({encrypted:id})
  if (!selectedSession) return res.json({message:'not found'})
  const selectedUser = await usersCollection.findOne({email:selectedSession["email"],password:selectedSession["password"]})
  res.json(selectedUser)
});

module.exports = router;
