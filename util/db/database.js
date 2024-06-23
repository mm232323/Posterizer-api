const { MongoClient } = require("mongodb");
const uri = require("./atlas_uri");
const client = new MongoClient(uri);
const dbname = "bank";

const connectToDB = async () => {
  try {
    await client.connect();
    console.log(`Connected to ${dbname} database 🏦`);
  } catch (err) {
    console.log("Error occured when connecting to DB: " + err);
  }
};
const main = async () => {
  try {
    await connectToDB();
  } catch (err) {
    console.log("Error occured when connecting to DB: " + err);
  } finally {
    await client.close();
  }
};
module.exports = main