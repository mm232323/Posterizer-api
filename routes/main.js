const express = require("express");

const router = express.Router();

const mainRoutes = require("../controllers/main.js");

router.post("/contact/add-message", mainRoutes.postMessage);

router.post("/signup/create-user", mainRoutes.createUser);

router.post("/signup/check-user", mainRoutes.SinginCheckUser);

router.post("/signup/create-session", mainRoutes.createSigninSession);

router.post("/login/check-user", mainRoutes.logInChekUser);

router.get("/login/create-session/:id", mainRoutes.createLoginSession);

router.get("/user/logout/:id", mainRoutes.logOut);

module.exports = router;
