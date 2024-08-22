const express = require("express");

const router = express.Router();

const path = require("path");

const db = require("../util/db/database");

const multer = require("multer");

const usersCollection = db.client.db("posterizer").collection("users");

const sessionsCollection = db.client.db("posterizer").collection("sessions");

const postsCounter = new Map();
const notificationsCounter = new Map();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/avatars"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload2 = multer({
  storage: storage2,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

router.get("/user/posts", async (req, res, next) => {
  let posts = await usersCollection.find({ gender: "on" }).toArray();
  posts = posts.map((user) => user.posts).filter((post) => post.length);
  if (posts.length < 2) posts = posts[0];
  else posts = posts.reduce((acc, current) => acc.concat(current));
  function shuffle(arr) {
    if (!arr) return [];
    let shuffledArray = arr.slice();

    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }
    return shuffledArray;
  }
  posts = shuffle(posts);
  return res.json({ posts });
});

router.get("/user/:Id", async (req, res, next) => {
  const id = req.params.Id;
  const selectedSession = await sessionsCollection.findOne({ id: id });
  if (!selectedSession)
    return res.json(JSON.stringify({ message: "not here" }));
  const selectedUser = await usersCollection.findOne({
    email: selectedSession["email"],
    password: selectedSession["password"],
  });
  return res.json(selectedUser);
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
    return res.json(
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
    return res.json(
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
  return res.status(200).json(JSON.stringify(selectedUser));
});

router.post("/user/post", async (req, res, next) => {
  let post = req.body;
  const userId = post.id;
  if (notificationsCounter.has(userId))
    notificationsCounter.set(userId, notificationsCounter.get(userId) + 1);
  else notificationsCounter.set(userId, 1);
  if (postsCounter.has(userId))
    postsCounter.set(userId, postsCounter.get(userId) + 1);
  else postsCounter.set(userId, 1);
  let notId = notificationsCounter.get(userId);
  let postId = postsCounter.get(userId);
  const selectedSession = await sessionsCollection.findOne({
    id: userId,
  });
  const selectedUser = await usersCollection.findOne({
    email: selectedSession["email"],
    password: selectedSession["password"],
  });
  const avatar = selectedUser["avatar"];
  post = { ...post, avatar, postId };
  selectedUser.posts.push(post);
  selectedUser.nots.myNots.push({ ...post, id: notId });
  await usersCollection.deleteOne({
    email: selectedSession["email"],
    password: selectedSession["password"],
  });
  await usersCollection.insertOne(selectedUser);
  const followers = selectedUser["followers"];
  for (let follower of followers) {
    const selectedFollowerSession = await sessionsCollection.findOne({
      id: follower,
    });
    const selectedFollowerUser = await usersCollection.findOne({
      email: selectedFollowerSession.email,
      password: selectedFollowerSession.password,
    });
    selectedFollowerUser.nots.followedNots.push(post);
    await usersCollection.deleteOne({
      email: selectedFollowerSession.email,
      password: selectedFollowerSession.password,
    });
    await usersCollection.insertOne(selectedFollowerUser);
  }
  return res.json(JSON.stringify({ message: "the post sent" }));
});

router.post(
  "/user/poster/:Id",
  upload.single("image"),
  async (req, res, next) => {
    const id = req.params.Id;
    const img = req.file;
    const selectedSession = await sessionsCollection.findOne({ id });
    const selectedUser = await usersCollection.findOne({
      email: selectedSession.email,
      password: selectedSession.password,
    });
    const posts = selectedUser.posts;
    posts[posts.length - 1].img = img;
    await usersCollection.deleteOne({
      email: selectedSession.email,
      password: selectedSession.password,
    });
    await usersCollection.insertOne(selectedUser);
    return res.json(
      JSON.stringify({ message: "post photo added successfully" })
    );
  }
);

router.post(
  "/user/add-avatar/:Id",
  upload2.single("image"),
  async (req, res, next) => {
    const avatar = req.file;
    const id = req.params.Id;
    const selectedSession = await sessionsCollection.findOne({ id });
    const selectedUser = await usersCollection.findOne({
      email: selectedSession.email,
      password: selectedSession.password,
    });
    selectedUser.avatar = avatar;
    selectedUser.avatarName = avatar.originalname;
    await usersCollection.deleteOne({
      email: selectedSession.email,
      password: selectedSession.password,
    });
    await usersCollection.insertOne(selectedUser);
    return res.json(JSON.stringify({ message: "the avatar changed" }));
  }
);
router.get("/user/avatar/:Id", async (req, res, next) => {
  const id = req.params.Id;
  const selectedSession = await sessionsCollection.findOne({ id });
  const selectedUser = await usersCollection.findOne({
    email: selectedSession.email,
    password: selectedSession.password,
  });
  return res.json(JSON.stringify({ avatar: selectedUser.avatarName }));
});
router.get("/user/notifications/:Id", async (req, res, next) => {
  const id = req.params.Id;
  const selectedSession = await sessionsCollection.findOne({ id });
  const selectedUser = await usersCollection.findOne({
    email: selectedSession.email,
    password: selectedSession.password,
  });
  return res.json(JSON.stringify(selectedUser.nots));
});
router.post("/user/delete-notification/:Id", async (req, res, next) => {
  const id = req.params.Id;
  const notId = req.body.id;
  const notType = req.body.type;
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
  if (notType == "me") {
    selectedUser.nots.myNots = selectedUser.nots.myNots.filter(
      (not) => notId !== not.id
    );
  } else
    selectedUser.nots.followedNots = selectedUser.nots.followedNots.filter(
      (not) => notId !== not.id
    );
  await usersCollection.insertOne(selectedUser);
  return res.json(
    JSON.stringify({ message: "The notification deleted successfully" })
  );
});
router.post("/user/like-post", async (req, res, next) => {
  const { userId, likerId, postId } = req.body;
  if (userId == likerId)
    return res.json({ message: "you can't like your posts" });
  const selectedLikerSession = await sessionsCollection.findOne({
    id: String(likerId),
  });
  const selectedUserSession = await sessionsCollection.findOne({
    id: String(userId),
  });
  const filter1 = {
    email: selectedLikerSession["email"],
    password: selectedLikerSession["password"],
  };
  const filter2 = {
    email: selectedUserSession["email"],
    password: selectedUserSession["password"],
  };
  const selectedLikerUser = await usersCollection.findOne(filter1);
  const selectedUserUser = await usersCollection.findOne(filter2);
  const foundedLike = selectedLikerUser.likes.filter(
    (like) => like.user == userId && like.postId == postId
  );
  if (foundedLike.length !== 0) {
    await usersCollection.deleteOne(filter1);
    selectedLikerUser.likes = selectedLikerUser.likes.filter(
      (like) => like.user !== userId || like.postId !== postId
    );
    await usersCollection.insertOne(selectedLikerUser);
    await usersCollection.deleteOne(filter2);
    selectedUserUser.posts = selectedUserUser.posts.map((post) =>
      post.postId === postId ? { ...post, reactions: post.reactions - 1 } : post
    );
    await usersCollection.insertOne(selectedUserUser);
  } else {
    console.log(foundedLike);
    await usersCollection.updateOne(filter1, {
      $push: { likes: { user: userId, postId } },
    });
    await usersCollection.deleteOne(filter2);
    selectedUserUser.posts = selectedUserUser.posts.map((post) =>
      post.postId === postId ? { ...post, reactions: post.reactions + 1 } : post
    );
    await usersCollection.insertOne(selectedUserUser);
  }
  res.json({ message: "post likes managed" });
});
router.post("/user/add-comment", async (req, res, next) => {
  const data = req.body;
  const selectedSession = await sessionsCollection.findOne({ id: data.user });
  const filter = {
    email: selectedSession.email,
    password: selectedSession.password,
  };
  const selectedUser = await usersCollection.findOne(filter);
  selectedUser.posts[+data.postId - 1].comments.push({
    comment: data.comment,
    commenter: data.commenter,
  });
  await usersCollection.deleteOne(filter);
  await usersCollection.insertOne(selectedUser);
  res.json({ message: "the comment sent seccessfully" });
});
module.exports = router;
