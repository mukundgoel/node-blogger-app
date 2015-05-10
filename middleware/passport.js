let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require('../user')

module.exports = (app) => {
  let passport = app.passport

  passport.use(new LocalStrategy({
    // Use "email" field instead of "username"
    usernameField: 'username',
    failureFlash: true
  }, nodeifyit(async (username, password) => {

    let user
    let email

    if (username.indexOf('@')) {
      email = username.toLowerCase()
      user = await User.promise.findOne({email})
    } else {
      let regexp = new RegExp(username, 'i')
      user = await User.promise.findOne({
        username: {$regexp: regexp}
      })
      console.log("User foudn :" + user)
    }

    // Do error validation
    console.log("user is: " + user)

    if (!email) {
       if (!user || username !== user.username) {
          return [false, {
          message: 'Invalid username'
        }]
      }
    } else {
        if (!user || email !== user.email) {
          return [false, {
          message: 'Invalid email'
        }]
      }
    }

    if (!await user.validatePassword(password)) {
      return [false, {message: 'Invalid password'}]
    }

    return user
  }, {spread: true})))

  passport.serializeUser(nodeifyit(async (user) => user._id))
  passport.deserializeUser(nodeifyit(async (id) => {
    return await User.promise.findById(id)
  }))

  passport.use('local-signup', new LocalStrategy({
    // Use "email" field instead of "username"
    usernameField: 'email',
    failureFlash: true,
    passReqToCallback: true
  }, nodeifyit(async (req, email, password) => {

    let username = req.body.username || ""
    let title = req.body.title || ""
    let description = req.body.description || ""
      email = (email || '').toLowerCase()
      // Is the email taken?
      if (await User.promise.findOne({email})) {
        return [false, {message: 'That email is already taken.'}]
      }
      console.log('here we go')
      // create the user
      let user = new User()
      user.username = username
      user.email = email
      user.password = await user.generateHash(password)

      return await user.save()
  }, {spread: true})))
}
