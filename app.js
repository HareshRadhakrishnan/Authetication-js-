//jshint esversion:6
require("dotenv").config();
const express =require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passport =require("passport");
const pasportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const FacebookStrategy = require( 'passport-facebook' ).Strategy;
const findOrCreate =require("mongoose-findorcreate")
const saltRounds =10;

app = express();
app.set("view engine","ejs");
app.use(express.static("public")) ;
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret: 'little secret',
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema( {
  username:String,
  password:String,
  googleId:String,
  secrets:String
})
userSchema.plugin(pasportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = mongoose.model("user",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id,function(err,user){
      done(err, user);
  })

});

passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home")
})
app.get("/auth/google",
  passport.authenticate('google', { scope:[ 'email', 'profile' ] }
))

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    res.redirect('/secrets');
  });

  app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
      res.render("submit")
    }else{
      res.redirect("/login");
    }
  })
  app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id,function(err,result){
      if(err){
        console.log(err);
      }else{
        if(result){
          result.secrets = submittedSecret;
          result.save(function(){
            res.redirect("/secrets")
          })

        }
      }
    })
  })

app.get("/login",function(req,res){
  res.render("login")
})
app.get("/register",function(req,res){
  res.render("register")
})
app.get("/logout",function(req,res){
  req.logout()
  res.redirect("/")
})
app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    User.find({"secrets":{$ne:null}},function(err,users){
      if(err){
        console.log(err);
      }else{
        res.render("secrets",{usersWithSecret:users});
      }
    })
  }else{
    res.redirect("/login")
  }
})


app.post("/login",function(req,res){
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      })
    }
  })
})
app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets")
      })
    }
  })

})

app.listen(3000, function(){
  console.log("server started on port 3000");
})
