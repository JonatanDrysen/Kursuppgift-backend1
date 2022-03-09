const mongoose = require("mongoose")

const postSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.ObjectId, ref: "User"},
    title: {type: String, required: true},
    content: {type: String, required: true},
    postTime: {type: Date, default: Date.now}
})

const newPost = mongoose.model("newPost", postSchema)

exports.newPost = newPost