const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const session = require("express-session");
const cookieParser = require("cookie-parser");
const app = express();
// app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
// mongoDB FZuoBWTPICSUgPdJ
const uri =
  "mongodb+srv://Lucas17:Samyu177@cluster0.frfuy.mongodb.net/myFirstDatabase";
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected…");
  })
  .catch((err) => console.log(err));

// Schemas

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  publicPosts: Array,
  privatePosts: Array,
});

const User = mongoose.model("User", userSchema);

// APP.USE ------------------
app.use(cookieParser());
app.use(session({ secret: "SecretKey!" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());

app.use(express.static("public"));

// FUNCTIONS --------------------------------

function checkSignIn(req, res, next) {
  if (req.session.user) {
    next(); //If session exists, proceed to page
  } else {
    res.render("index.ejs", { message: null });
  }
}

// APP.GETS ---------------------------------
app.get("/", checkSignIn, (req, res) => {
  //   console.log("Session Active" + req.session.user);
  User.findOne({ email: req.session.user }, (err, user) => {
    res.render("home.ejs", { user: user.firstName });
  });
});

app.get("*", checkSignIn, function (req, res) {
  User.findOne({ email: req.session.user }, (err, user) => {
    res.redirect("/");
  });
});

// APP.POSTS --------------------------------

// SignUp
app.post("/signUp", (req, res) => {
  // Look for the user
  User.findOne({ email: req.body.email }, (err, user) => {
    if (user == null) {
      if (req.body.password == req.body.repassword) {
        // if no user is found check passwords make sure they are the same if they are then create a new user
        const user = new User({
          firstName: req.body.fName,
          lastName: req.body.lName,
          email: req.body.email,
          password: req.body.password,
        });

        user.save();

        res.render("home.ejs", { user: user.firstName });
      } else {
        res.render("index.ejs", {
          message: "Your passwords didn't match, please try again.",
        });
      }
    } else if (user) {
      //if a user is found redirect to main screen
      res.render("index.ejs", {
        message: "Looks like you already have an account! :) Please sign in.",
      });
    } else {
      console.log(err);
    }
  });
});

// login
app.post("/login", (req, res) => {
  // Look for the user
  User.findOne({ email: req.body.email }, (err, user) => {
    if (user == null) {
      //if a user is not found redirect to main screen
      res.render("index.ejs", {
        message: "Doesn't look like you have an account! :( Please sign up.",
      });
    } else if (user) {
      if (req.body.password == user.password) {
        req.session.user = user.email;
        res.render("home.ejs", { user: user.firstName });
      } else {
        res.render("index.ejs", {
          message: "Password is incorrect. Try again",
        });
      }
    } else {
      console.log(err);
    }
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy(function () {
    console.log("user logged out.");
  });
  res.render("index.ejs", { message: "You've logged out. Come back soon!" });
});

app.listen("3000", () => {
  console.log("ALL GOOD!");
});
