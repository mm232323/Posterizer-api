const express = require("express");

const router = express.Router();

const db = require("../util/db/database");

const messagesCollection = db.client.db("posterizer").collection("messages");
const usersCollection = db.client.db("posterizer").collection("users");
const sessionsCollection = db.client.db("posterizer").collection("sessions");
const unAuthedCollection = db.client.db("posterizer").collection("unauthed");
router.post("/contact/add-message", (req, res, next) => {
  const message = req.body;
  messagesCollection.insertOne(message);
  res.redirect("/contact");
  return "THE MESSAGE ADDED";
});

router.post("/signup/create-user", async (req, res, next) => {
  const user = req.body;
  usersCollection.insertOne(user);
  res.status(200).json(JSON.stringify({ message: "THE USER CREATED" }));
});
router.post("/signup/check-user", async (req, res, next) => {
  const email = req.body.email;
  const user = await usersCollection.findOne({
    email: email,
  });
  const isExisting = user !== null;
  res.status(200).json(JSON.stringify({ isExisting }));
});
router.post("/signup/create-session", async (req, res, next) => {
  const session = req.body;
  sessionsCollection.insertOne(session);
  res.status(200).json(JSON.stringify({ message: "session is created" }));
});

router.post("/login/check-user", async (req, res, next) => {
  const user = req.body;
  console.log(user);
  let result = await usersCollection.findOne({
    email: user.email,
    password: user.password,
  });
  res.json(JSON.stringify({ isVerified: result }));
});

router.get("/login/create-session/:id", async (req, res, next) => {
  const id = req.params.id;
  const findSession = await sessionsCollection.findOne({ id: id });
  if (findSession)
    res.json(JSON.stringify({ message: "session is alraedy created" }));
  const findunAuthed = await unAuthedCollection.findOne({ id: id });
  sessionsCollection.insertOne(findunAuthed);
  await unAuthedCollection.deleteOne({ id: id });
  res.json(JSON.stringify({ message: "session created" }));
});

router.get("/user/logout/:id", async (req, res, next) => {
  const id = req.params.id;
  const selectedSession = await sessionsCollection.findOne({ id: id });
  unAuthedCollection.insertOne(selectedSession);
  await sessionsCollection.deleteOne({ id: id });
  res.json(JSON.stringify({ message: "signed out successfuly" }));
});
module.exports = router;
