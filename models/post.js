let mongoose = require('mongoose')
require('songbird')

let postSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    data: Buffer,
    contentType: String
  },
  date: {
    type: String,
    required: true
  },
   blogTitle: {
    // This is a way to link a post to a blog (by using blog title)
    type: String,
    required: true
  },
})

module.exports = mongoose.model('Post', postSchema)
