const db = require("../util/db/database");

const usersCollection = db.client.db("posterizer").collection("users");

const postsCounter = new Map();

const notificationsCounter = new Map();

const User = require("../models/User");

exports.getPosts = async (req, res) => {
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
  return res.json({ posts, db: db.client.db("posterizer") });
};

exports.getUser = async (req, res) => {
  const id = req.params.Id;
  const output = await User.getUserById(id);
  return res.json(output);
};

exports.handleFollowing = async (req, res) => {
  const followerUser = req.body.followerId;

  const followedUser = req.body.followedId;

  const isFollowed = req.body.isFollowed;

  const selectedFollowerSession = await User.getUserById(followerUser);

  const selectedFollowedSession = await User.getUserById(followedUser);

  if (isFollowed == "false") {
    await User.update(
      selectedFollowerSession["email"],
      selectedFollowerSession["password"],
      { $push: { followed: followedUser } }
    );
    await User.update(
      selectedFollowedSession["email"],
      selectedFollowedSession["password"],
      { $push: { followers: followerUser } }
    );

    return res.json(
      JSON.stringify({
        message: `you followed ${selectedFollowedSession["name"]}`,
      })
    );
  } else {
    const selectedFollowerUser = await User.getUserByAuth(
      selectedFollowerSession["email"],
      selectedFollowerSession["password"]
    );
    const selectedFollowedUser = await User.getUserByAuth(
      selectedFollowerSession["email"],
      selectedFollowerSession["password"]
    );

    selectedFollowerUser.followed = selectedFollowerUser.followed.filter(
      (userId) => userId !== followedUser
    );
    selectedFollowedUser.followers = selectedFollowedUser.followers.filter(
      (follower) => follower !== followerUser
    );

    const delMessage = User.deleteUser(
      selectedFollowerSession["email"],
      selectedFollowerSession["password"]
    );

    new User(selectedFollowerUser);

    const delMessage2 = User.deleteUser(
      selectedFollowedSession["email"],
      selectedFollowedSession["password"]
    );

    new User(selectedFollowedUser);
    return res.json(
      JSON.stringify({
        message: `you followed ${selectedFollowedSession["name"]}`,
      })
    );
  }
};

exports.getUser2 = async (req, res) => {
  const id = req.params.id;
  const user = User.getUserById(id);
  return res.status(200).json(user);
};

exports.postPost = async (req, res) => {
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
  const selectedUser = await User.getUserById(userId);
  const avatar = selectedUser["avatar"];
  post = { ...post, avatar, postId };
  selectedUser.posts.push(post);
  selectedUser.nots.myNots.push({ ...post, id: notId });
  const deleteMessage = await User.deleteUser(
    selectedUser.email,
    selectedUser.password
  );
  new User(selectedUser);
  const followers = selectedUser["followers"];
  for (let follower of followers) {
    const selectedFollowerUser = await User.getUserById(follower);
    selectedFollowerUser.nots.followedNots.push(post);
    await User.deleteUser(
      selectedFollowerUser.email,
      selectedFollowerUser.password
    );
    new User(selectedFollowerUser);
  }
  return res.json(JSON.stringify({ message: "the post sent" }));
};

exports.handlePostImg = async (req, res, next) => {
  const id = req.params.Id;
  const img = req.file;
  const selectedUser = await User.getUserById(id);
  const posts = selectedUser.posts;
  if (img.originalname !== "undefined") posts[posts.length - 1].img = img;
  await User.deleteUser(selectedUser.email, selectedUser.password);
  new User(selectedUser);
  return res.json(JSON.stringify({ message: "post photo added successfully" }));
};

exports.postAvatar = async (req, res, next) => {
  const avatar = req.file;
  const id = req.params.Id;
  const selectedUser = await User.getUserById(id);
  selectedUser.avatar = avatar;
  selectedUser.avatarName = avatar.originalname;
  await User.deleteUser(selectedUser.email, selectedUser.password);
  new User(selectedUser);
  return res.json(JSON.stringify({ message: "the avatar changed" }));
};

exports.handleAvatarImg = async (req, res, next) => {
  const id = req.params.Id;
  const selectedUser = await User.getUserById(id);
  return res.json(JSON.stringify({ avatar: selectedUser.avatarName }));
};

exports.getNots = async (req, res, next) => {
  const id = req.params.Id;
  const selectedUser = await User.getUserById(id);
  return res.json(JSON.stringify(selectedUser.nots));
};

exports.deleteNot = async (req, res, next) => {
  const id = req.params.Id;
  const notId = req.body.id;
  const notType = req.body.type;
  notificationsCounter.set(id, notificationsCounter.get(id) - 1);
  const selectedUser = await User.getUserById(id);
  await User.deleteUser(selectedUser.email, selectedUser.password);
  if (notType == "me") {
    selectedUser.nots.myNots = selectedUser.nots.myNots.filter(
      (not) => notId !== not.id
    );
  } else
    selectedUser.nots.followedNots = selectedUser.nots.followedNots.filter(
      (not) => notId !== not.id
    );
  new User(selectedUser);
  return res.json(
    JSON.stringify({ message: "The notification deleted successfully" })
  );
};

exports.handleLikePost = async (req, res, next) => {
  const { userId, likerId, postId } = req.body;
  if (userId == likerId)
    return res.json({ message: "you can't like your posts" });
  const selectedLikerUser = await User.getUserById(likerId);
  const selectedUserUser = await User.getUserById(userId);
  const likerFilter = {
    email: selectedLikerUser.email,
    password: selectedLikerUser.password,
  };
  const userFilter = {
    email: selectedUserUser.email,
    password: selectedUserUser.password,
  };
  const foundedLike = selectedLikerUser.likes.filter(
    (like) => like.user == userId && like.postId == postId
  );
  if (foundedLike.length) {
    await User.deleteUser(likerFilter.email, likerFilter.password);
    selectedLikerUser.likes = selectedLikerUser.likes.filter(
      (like) => like.user !== userId && like.postId !== postId
    );
    new User(selectedLikerUser);
    await User.deleteUser(userFilter.email, userFilter.password);
    selectedUserUser.posts[postId - 1].reactions--;
    new User(selectedUserUser);
  } else {
    await User.deleteUser(likerFilter.email, likerFilter.password);
    selectedLikerUser.likes.push({ user: userId, postId });
    new User(selectedLikerUser);
    await User.deleteUser(userFilter.email, userFilter.password);
    selectedUserUser.posts[postId - 1].reactions++;
    new User(selectedUserUser);
  }
  res.json({ message: "post likes managed" });
};

exports.postComment = async (req, res, next) => {
  const data = req.body;
  const selectedUser = await User.getUserById(data.user);
  const userFilter = {
    email: selectedUser.email,
    password: selectedUser.password,
  };
  selectedUser.posts[+data.postIdcls].comments.push({
    comment: data.comment,
    commenter: data.commenter,
  });
  await User.deleteUser(userFilter.email, userFilter.password);
  new User(selectedUser);
  res.json({ message: "the comment sent seccessfully" });
};
