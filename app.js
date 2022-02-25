//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");  //1
const passport = require("passport")         //2
const passportLocalMongoose = require("passport-local-mongoose");  //3
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");


app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true 
}));

app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {   //create cookie, user identification
  done(null, user);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


passport.use(new FacebookStrategy({
  clientID: process.env.APP_ID_FB,
  clientSecret: process.env.APP_SECRET_FB,
  callbackURL: "http://localhost:3000/auth/facebook/secrets"
}, 
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile);
    
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", (req, res) => {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })   //profile including "email & userID"
);

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets page.
    res.redirect('/secrets');
  });
  
  app.get("/login", (req, res) => {
    res.render("login");
  });
  
  app.get("/register", (req, res) => {
    res.render("register");
  });
  
  app.post("/register", (req, res) => {
   User.register({username: req.body.username}, req.body.password, (err, user) => {
    if(err) {
      console.log(err)
      res.redirect("/register")
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets")
      })
    }
  });
});
  

  app.get("/auth/facebook",
    passport.authenticate("facebook")
  );
  
  app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
    // Successful authentication, redirect to secrets page.
       res.redirect('/secrets');
    });


app.post("/login", (req, res) => {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user, (err) => {
    if(err) {
      console.log(err)
    } else { 
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets")
      })
    }
  });
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.get("/secrets", function(req, res){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});

app.get("/submit", (req, res) => {
  if(req.isAuthenticated()) {
    res.render("submit")
  } else {
    res.redirect("/login")
  }
});

app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;
  
  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);
  
  User.findById((req.user._id), function(err, foundUser) {
    if(err){
      console.log(err)
    } else {
      if(foundUser){ 
        foundUser.secret = submittedSecret
          foundUser.save(() => {
           res.redirect("/secrets")
          });
      }
    }
  });
});

app.listen(3000, function () {
  console.log("App is listening at port 3000");
});
