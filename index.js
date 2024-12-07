const bodyparser = require("body-parser");

const express = require("express");
const mainRoutes = require("./routes/main");
const userRoutes = require("./routes/user");
const app = express();
const db = require("./util/db/database");
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.use(express.static("public"));

const main = async () => {
  try {
    await db.connectToDB();
    console.log("seccussful connected to posterizer database");
  } catch (err) {
    console.log("connecting failed");
  }
};
main();

app.use("/", mainRoutes);
app.use("/", userRoutes);
app.use((req, res, next) => {
  res.send("<h1>hello world</h1>");
});

app.listen(8080);
