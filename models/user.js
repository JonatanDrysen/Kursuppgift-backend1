const mongoose = require("mongoose")
const plm = require("passport-local-mongoose")

const userSchema = new mongoose.Schema({
    email: {type: String},
    fullName: {type: String},
    profilePicture: {
        type: String,
        default: "/images/default_profile_img.png"
    }
})

userSchema.plugin(plm)

const User = mongoose.model("User", userSchema)

exports.User = User