const { MongoClient } = require("mongodb");
const uri = require("./atlas_uri");
const client = new MongoClient(uri);
const connectToDB = async () => {
  try {
    await client.connect();
    console.log(`Connected to posterizer database 🏦`);
  } catch (err) {
    console.log("Error occured when connecting to DB: " + err);
  }
};
module.exports = { connectToDB, client };
