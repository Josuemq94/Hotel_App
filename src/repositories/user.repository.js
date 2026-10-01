const User = require("../models/user.model");

class UserRepository {
  findByEmail(email) {
    return User.findOne({ email });
  }

  findByEmailWithPassword(email) {
    return User.findOne({ email }).select("+password");
  }

  create(data) {
    return User.create(data);
  }

  findAll() {
    return User.find({}, "name email role createdAt").sort({ name: 1 });
  }

  upsertGoogleUser(data) {
    return User.findOneAndUpdate(
      { email: data.email },
      { $set: data },
      { new: true, upsert: true, runValidators: true },
    );
  }
}

module.exports = new UserRepository();
