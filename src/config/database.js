const mongoose = require("mongoose");

class Database {
  static instance;

  constructor() {
    if (Database.instance) {
      return Database.instance;
    }

    this.connection = null;
    Database.instance = this;
  }

  async connect(uri) {
    if (this.connection) {
      return this.connection;
    }

    if (!uri) {
      throw new Error("MONGODB_URI is not configured");
    }

    this.connection = await mongoose.connect(uri);
    return this.connection;
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
    }
  }
}

module.exports = new Database();
