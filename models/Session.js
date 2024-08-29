const db = require("../util/db/database");

const sessionsCollection = db.client.db("posterizer").collection("sessions");

class Session {
  constructor(session) {
    this.session = session;
    const postSession = async () =>
      await sessionsCollection.insertOne(this.session);
    postSession();
  }
  static async get(id) {
    const foundSession = await sessionsCollection.findOne({ id });
    if (foundSession == null) return { message: "session not found" };
    return foundSession;
  }
  static async deleteSession(id) {
    await sessionsCollection.deleteOne({ id });
    return "session deleted";
  }
}
module.exports = Session;
