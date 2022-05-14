const axios = require('axios');
const cheerio = require('cheerio');
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const User = require("./models/User");
const CoinGecko = require('coingecko-api');
const bcrypt = require("bcryptjs");
const {
  checkAuthenticated,
  checkNotAuthenticated,
} = require("./middlewares/auth");

const app = express();

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  async (email) => {
    const userFound = await User.findOne({ email });
    return userFound;
  },
  async (id) => {
    const userFound = await User.findOne({ _id: id });
    return userFound;
  }
);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/dash", checkAuthenticated, (req, res) => {
  res.render("dash", {
    name: req.user.name, email: req.user.email,
    fullName: req.user.fullName, contact: req.user.contact
  });
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register");
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/dash",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post("/register", checkNotAuthenticated, async (req, res) => {
  const userFound = await User.findOne({ email: req.body.email });

  if (userFound) {
    req.flash("error", "User with that email already exists");
    res.redirect("/register");
  } else {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new User({
        fullName: req.body.fullName,
        contact: req.body.contact,
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,

      });

      // await User.create(user);
      await user.save();
      res.redirect("/login");
    } catch (error) {
      console.log(error);
      res.redirect("/register");
    }
  }
});

app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/login");
});


// Establishing the port
const PORT = process.env.PORT;
const uri = process.env.MONGODB_URI;

// Executing the server on given port number
mongoose
  .connect(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });
//   .then(() => {
  app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
  });
    

mongoose.connection.on("connected", () => {
  console.log("Mongoose is connected");
});
