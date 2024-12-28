const express = require("express");

const router = express.Router();

const userRoutes = require("../controllers/user.js");

const path = require("path");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + file.originalname);
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
    cb(null, new Date().getTime() + file.originalname);
  },
});

const upload2 = multer({
  storage: storage2,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

router.get("/user/posts", userRoutes.getPosts);

router.get("/user/:Id", userRoutes.getUser);

router.post("/user/following", userRoutes.handleFollowing);

router.get("/user/get/:id", userRoutes.getUser2);

router.post("/user/post", userRoutes.postPost);

router.post(
  "/user/poster/:Id",
  upload.single("image"),
  userRoutes.handlePostImg
);

router.post(
  "/user/add-avatar/:Id",
  upload2.single("image"),
  userRoutes.postAvatar
);
router.get("/user/avatar/:Id", userRoutes.handleAvatarImg);

router.get("/user/notifications/:Id", userRoutes.getNots);

router.post("/user/delete-notification/:Id", userRoutes.deleteNot);

router.post("/user/like-post", userRoutes.handleLikePost);

router.post("/user/add-comment", userRoutes.postComment);

module.exports = router;
