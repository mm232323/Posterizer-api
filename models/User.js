const db = require("../util/db/database");

const usersCollection = db.client.db("posterizer").collection("users");

const sessionsCollection = db.client.db("posterizer").collection("sessions");

class User {
  constructor(user) {
    this.user = user;
    const postUser = async () => await usersCollection.insertOne(this.user);
    postUser();
  }
  static async getUserById(id) {
    const selectedSession = await sessionsCollection.findOne({ id });
    if (!selectedSession) return { message: "session not found" };
    const selectedUser = await usersCollection.findOne({
      email: selectedSession["email"],
      password: selectedSession["password"],
    });
    return selectedUser;
  }
  static async getUserByAuth(email, password) {
    const selectedSession = await sessionsCollection.findOne({
      email,
      password,
    });
    if (!selectedSession) return { message: "session not found" };
    const selectedUser = await usersCollection.findOne({
      email: selectedSession["email"],
      password: selectedSession["password"],
    });
    return selectedUser;
  }
  static async getUserByCustom(query) {
    const selectedUser = await usersCollection.findOne(query);
    return selectedUser;
  }
  static async update(email, password, update) {
    console.log(update);
    await usersCollection.updateOne(
      {
        email,
        password,
      },
      update
    );
    return "User Updated";
  }
  static async deleteUser(email, password) {
    const output = await usersCollection.deleteOne({ email, password });
    return "User Deleted";
  }
}
module.exports = User;
