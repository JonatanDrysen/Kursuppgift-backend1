const mongoose = require("mongoose")
const plm = require("passport-local-mongoose")

const userSchema = new mongoose.Schema({
    email: {type: String}
})

userSchema.plugin(plm)

const User = mongoose.model("User", userSchema)

exports.User = User