
const express=require("express");
const bodyParser=require("body-parser");
var findOrCreate = require('mongoose-findorcreate');
const ejs=require("ejs");
require('dotenv').config();
const mongoose=require("mongoose");
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;


const app=express();
const session = require('express-session');

//set up middelware
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));



//set up session
app.use(session({
    secret: 'Mys',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 , secure: false }
  }));


//Initialize passport and passport session
app.use(passport.initialize());
passport.use(passport.session());

//Serialize and deserialize user
passport.serializeUser(function(user,done){
    done(null,user.id);
});

passport.deserializeUser(function(id, done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});

//schema creation
const userSchema = new mongoose.Schema({

    email: String,
    password: String,
    googleId: String
  
  });

userSchema.plugin(findOrCreate);

//conect to db
mongoose.connect("mongodb://127.0.0.1:27017/userdb",{useNewUrlParser:true}).then(console.log('MongoDB connected!!')) ;
const User=new mongoose.model("User", userSchema);



//Set up passport withh GoogleStrategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    passReqToCallback:true
  },
  function(request,accesToken, refreshToken, profile, done) {
    User.findOrCreate({googleId: profile.id},function(err,user){
        return done(null,profile);
    });
  }
));

app.get('/auth/google',passport.authenticate('google',{scope:['email','profile']}));

app.get('/auth/google/secrets', passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    a=req.isAuthenticated();
    console.log("Estado de autenticacion"+a)
    // Successful authentication, redirect home.
    console.log("Usuario autenticado:", req.user);
    res.redirect("/secrets");
  });

app.get("/secrets",function(req,res){
    b=req.isAuthenticated();
    console.log("Estado de autenticacion"+b);
    if (req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.get("/",function(req,res){
    res.render("home")
});

app.get("/login",function(req,res){
    res.render("login")
});

app.get("/register",function(req,res){
    res.render("register")
});

app.get("/logout",function(req,res){
    res.render("home");
})



//LOCAL 
app.post("/register",function(req,res){
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    });
    console.log(req.body.username);
    console.log(req.body.password);
    newUser.save().then(res.render("secrets"));
});

app.post("/login",function(req,res){
    const username=req.body.username;
    const password=req.body.password;


User.findOne({email:username}).then((foundUser)=>
{if(foundUser.password===password){
        res.render("secrets")};
    }).catch((err)=>{
        console.error(err);
        res.render("home");
    });
});


app.listen(3000,function(){
console.log("Server running on port 3000");
});