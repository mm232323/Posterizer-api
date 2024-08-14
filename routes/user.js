const express = require("express");

const router = express.Router();

const path = require("path");

const db = require("../util/db/database");

const multer = require("multer");

const usersCollection = db.client.db("posterizer").collection("users");

const sessionsCollection = db.client.db("posterizer").collection("sessions");

const notificationsCounter = new Map();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

router.get("/user/:Id", async (req, res, next) => {
  const id = req.params.Id;
  const selectedSession = await sessionsCollection.findOne({ id: id });
  if (!selectedSession) return res.json({ message: "not found" });
  const selectedUser = await usersCollection.findOne({
    email: selectedSession["email"],
    password: selectedSession["password"],
  });
  res.json(selectedUser);
});

router.post("/user/following", async (req, res, next) => {
  const followerUser = req.body.followerId;

  const followedUser = req.body.followedId;

  const isFollowed = req.body.isFollowed;

  const selectedFollowerSession = await sessionsCollection.findOne({
    id: followerUser,
  });

  const selectedFollowedSession = await sessionsCollection.findOne({
    id: followedUser,
  });
  if (isFollowed == "false") {
    await usersCollection.updateOne(
      {
        email: selectedFollowerSession["email"],
        password: selectedFollowerSession["password"],
      },
      { $push: { followed: followedUser } }
    );

    await usersCollection.updateOne(
      {
        email: selectedFollowedSession["email"],
        password: selectedFollowedSession["password"],
      },
      { $push: { followers: followerUser } }
    );
    res.json(
      JSON.stringify({
        message: `you followed ${selectedFollowedSession["name"]}`,
      })
    );
  } else {
    const selectedFollowerUser = await usersCollection.findOne({
      email: selectedFollowerSession["email"],
      password: selectedFollowerSession["password"],
    });

    selectedFollowerUser.followed = selectedFollowerUser.followed.filter(
      (userId) => userId !== followedUser
    );

    await usersCollection.deleteOne({
      email: selectedFollowerSession["email"],
      password: selectedFollowerSession["password"],
    });

    await usersCollection.insertOne(selectedFollowerUser);

    await usersCollection.updateOne(
      {
        email: selectedFollowedSession["email"],
        password: selectedFollowedSession["password"],
      },
      { $push: { followers: id } }
    );
    res.json(
      JSON.stringify({
        message: `you followed ${selectedFollowedSession["name"]}`,
      })
    );
  }
});

router.get("/user/get/:id", async (req, res, next) => {
  const id = req.params.id;
  const selectedSession = await sessionsCollection.findOne({
    id: id,
  });
  const selectedUser = await usersCollection.findOne({
    email: selectedSession["email"],
    password: selectedSession["password"],
  });
  res.status(200).json(JSON.stringify(selectedUser));
});

router.post("/user/post", async (req, res, next) => {
  let post = req.body;
  const img = post.img;
  const userId = post.id;
  if (notificationsCounter.has(userId))
    notificationsCounter.set(userId, notificationsCounter.get(userId) + 1);
  else notificationsCounter.set(userId, 1);
  let notId = notificationsCounter.get(userId);
  const selectedSession = await sessionsCollection.findOne({
    id: userId,
  });
  const selectedUser = await usersCollection.findOne({
    email: selectedSession["email"],
    password: selectedSession["password"],
  });
  const avatar = selectedUser["avatar"];
  post = { ...post, avatar };
  await usersCollection.updateOne(
    {
      email: selectedSession["email"],
      password: selectedSession["password"],
    },
    { $push: { posts: post, nots: { ...post, id: notId } } }
  );
  const followers = selectedUser["followers"];
  res.json(JSON.stringify({ message: "the post sent" }));
});
router.post(
  "/user/add-avatar/:Id",
  upload.single("image"),
  async (req, res, next) => {
    const avatar = req.file;
    const id = req.params.Id;
    const selectedSession = await sessionsCollection.findOne({ id });
    console.log(selectedSession);
    await usersCollection.updateOne(
      { email: selectedSession.email, password: selectedSession.password },
      { avatar }
    );
    res.json(JSON.stringify({ message: "the avatar changed" }));
  }
);
router.post("/user/delete-notification/:Id", async (req, res, next) => {
  const id = req.params.Id;
  const notId = req.body.id;
  notificationsCounter.set(id, notificationsCounter.get(id) - 1);
  const selectedSession = await sessionsCollection.findOne({ id });
  const selectedUser = await usersCollection.findOne({
    email: selectedSession["email"],
    password: selectedSession["password"],
  });
  await usersCollection.deleteOne({
    email: selectedSession["email"],
    password: selectedSession["password"],
  });
  selectedUser.nots = selectedUser.nots.filter((not) => notId !== not.id);
  await usersCollection.insertOne(selectedUser);
  res.json(
    JSON.stringify({ message: "The notification deleted successfully" })
  );
});
module.exports = router;
