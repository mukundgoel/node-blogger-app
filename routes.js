let fs = require('fs')
let multiparty = require('multiparty')
let then = require('express-then')
let isLoggedIn = require('./middleware/isLoggedIn')
let Post = require('./models/post')
let User = require('./user')

module.exports = (app) => {
  let passport = app.passport

  app.get('/', (req, res) => {
    res.render('index.ejs')
  })

  app.get('/login', (req, res) => {
    res.render('login.ejs', {message: req.flash('error')})
  })

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }))

  app.get('/signup', (req, res) => {
    res.render('signup.ejs', {message: req.flash('error')})
  })

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }))

  app.get('/profile', isLoggedIn, (req, res) => {

    console.log(req.user)

    res.render('profile.ejs', {
      user: req.user,
      message: req.flash('error')
    })
  })

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  app.get('/post/:postId?', then(async (req, res) => {
    let postId = req.params.postId
    if (!postId) {
      res.render('post.ejs', {
        post: {},
        verb: 'Create'
      })
      return
    } else {
        let post = await Post.promise.findById(postId)
        if (!post) res.send(404, "Not Found")

        res.render('post.ejs', {
          post: post,
          verb: 'Edit'
        })
    }
  }))

// we are using then because we want it called only in case of error
// if we use nodeifyit then it will always be called
  app.post('/post/:postId?', then(async (req, res) => {
    let postId = req.params.postId
    if (!postId) {
      let post = new Post()

      console.log("req user is the following:")
      console.log(req.user)

      // we will get a [field, file] array.. we can do [, files] and get the first file that we need
      let [{title: [title], content: [content]},{image: [file]}] = await new multiparty.Form().promise.parse(req)
      post.title = title
      post.content = content
      post.image.data = await fs.promise.readFile(file.path)
      post.image.contentType = file.headers['content-type']
      post.date = new Date().toString()
    
      // also store the blog title this post belongs to
      post.blogTitle = req.user.blogTitle

      await post.save()
      res.redirect('/blog/' + encodeURI(req.user.blogTitle))
      return
    }

    // if here that means we have a postId present so we want to edit the post
    let post = await Post.promise.findById(postId)
    if (!post) res.send(404, "Not Found")

      let [{title: [title], content: [content]},{image: [file]}] = await new multiparty.Form().promise.parse(req)
      post.title = title
      post.content = content
      post.date = new Date().toString()
      await post.save()
      res.redirect('/blog/' + encodeURI(req.user.blogTitle))
  }))

app.get('/blog/:blogId?', then(async(req, res) => {

/* Don't need this check anymore since blogs are public by default now
  // check if user is logged in, else redirect back to homepage
  if (!req.user) {
    res.redirect('/')
    return
  }
*/

  // Here we are assuming that title of the blog will be passed in as the blog id
  let blogTitle = req.params.blogId

  let blogPosts = await Post.promise.find({
    'blogTitle': blogTitle
  })

  console.log(blogPosts)

  res.render('blog.ejs', {
    blogTitle: blogTitle,
    posts: blogPosts
  })
}))
}
