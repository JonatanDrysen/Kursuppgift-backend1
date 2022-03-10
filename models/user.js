const mongoose = require("mongoose")
const plm = require("passport-local-mongoose")

const userSchema = new mongoose.Schema({
    email: {type: String}
})

userSchema.plugin(plm)

exports.User = mongoose.model("User", userSchema)