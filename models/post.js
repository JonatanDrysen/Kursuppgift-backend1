const mongoose = require("mongoose")

const postSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.ObjectId, ref: "User"},
    title: {type: String},
    content: {type: String, required: true},
    postTime: {type: Date, default: Date.now}
})

const Post = mongoose.model("Post", postSchema)

exports.Post = Post