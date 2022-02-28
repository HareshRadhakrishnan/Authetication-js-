//jshint esversion:6
const express =require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

app = express();
app.set("view engine","ejs");
app.use(express.static("public")) ;
app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect("mongodb://localhost:27017/userDB")

const userSchema = new mongoose.Schema( {
  username:String,
  password:String
})
const encryptionKey ="thisismyencryptionkey"
userSchema.plugin(encrypt,{secret:encryptionKey,encryptedFields:["password"]});
const User = mongoose.model("user",userSchema);


app.get("/",function(req,res){
  res.render("home")
})
app.get("/login",function(req,res){
  res.render("login")
})
app.get("/register",function(req,res){
  res.render("register")
})

app.post("/login",function(req,res){
  User.findOne({username:req.body.username},function(err,result){
    if(err){
      console.log(err);
    }else{
      if(result){
        if(result.password === req.body.password){
          res.render("secrets")
        }
        else {
          res.send("wrong password")
        }
      }
    }
  })
  console.log('');
})
app.post("/register",function(req,res){
  const newUser = User({
    username:req.body.username,
    password:req.body.password
  })
  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("secrets")
    }
  })

})

app.listen(3000, function(){
  console.log("server started on post 3000");
})
