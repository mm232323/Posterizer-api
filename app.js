const bodyparser = require("body-parser");

const express = require("express");
const mainRoutes = require("./routes/main");
const userRoutes = require("./routes/user");
const app = express();
const db = require("./util/db/database");
const cors = require("cors");

app.use(cors());
app.use(
  bodyparser.urlencoded({
    extended: true,
    parameterLimit: 1000000,
    limit: "1500mb",
  })
);

app.use(express.json());

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

app.listen(8080);
