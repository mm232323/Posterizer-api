const db = require("../util/db/database");

const messagesCollection = db.client.db("posterizer").collection("messages");
// const usersCollection = db.client.db("posterizer").collection("users");
// const sessionsCollection = db.client.db("posterizer").collection("sessions");
const unAuthedCollection = db.client.db("posterizer").collection("unauthed");
const User = require("../models/User");
const Session = require("../models/Session");
exports.postMessage = async (req, res, next) => {
  const message = req.body;
  console.log(message);
  messagesCollection.insertOne(message);
  res.json({ message: "THE MESSAGE ADDED" });
};

exports.createUser = async (req, res, next) => {
  const user = req.body;
  console.log(user);
  new User(user);
  res.status(200).json(JSON.stringify({ message: "THE USER CREATED" }));
};

exports.SinginCheckUser = async (req, res, next) => {
  const email = req.body.email;
  const user = await User.getUserByCustom({ email });
  const isExisting = user !== null;
  res.status(200).json(JSON.stringify({ isExisting }));
};

exports.createSigninSession = async (req, res, next) => {
  const session = req.body;
  console.log(session);
  new Session(session);
  res.status(200).json(JSON.stringify({ message: "session is created" }));
};

exports.logInChekUser = async (req, res, next) => {
  const user = req.body;
  let result = await User.getUserByCustom({
    email: user.email,
    password: user.password,
  });
  res.json(JSON.stringify({ isVerified: result }));
};

exports.createLoginSession = async (req, res, next) => {
  const id = req.params.id;
  const findSession = await Session.get(id);
  console.log(findSession);
  if (findSession?.id)
    return res.json(JSON.stringify({ message: "session is alraedy created" }));
  const findunAuthed = await unAuthedCollection.findOne({ id: id });
  new Session(findunAuthed);
  await unAuthedCollection.deleteOne({ id: id });
  console.log("session created");
  res.json(JSON.stringify({ message: "session created" }));
};

exports.logOut = async (req, res, next) => {
  const id = req.params.id;
  const selectedSession = await Session.get(id);
  console.log(selectedSession);
  unAuthedCollection.insertOne(selectedSession);
  const deleteMessage = await Session.deleteSession(id);
  res.json(JSON.stringify({ message: "signed out successfuly" }));
};
