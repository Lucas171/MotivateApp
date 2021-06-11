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

mongoose.set("useFindAndModify", false);
// Schemas

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  publicPosts: [String],
  privatePosts: [String],
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

app.use("/user/:id", function (req, res, next) {
  User.findOne({ _id: req.params.id }, (err, user) => {
    if (user) {
      res.json(user);
    }
  });
  //   console.log("Request Id:", );
  //   next();
});

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
app.get("/settings", checkSignIn, (req, res) => {
  console.log("nice");
  User.findOne({ email: req.session.user }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      res.render("settings.ejs", {
        user: user.firstName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        message: null,
      });
    }
  });
});

app.get("/profile", (req, res) => {
  res.render("profile.ejs");
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
          privatePosts: [""],
          publicPosts: [""],
        });

        user.save();
        req.session.user = user.email;
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

app.post("/changePassword", checkSignIn, (req, res) => {
  User.findOne({ email: req.session.user }, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else if (req.body.currentPassword == user.password) {
      if (req.body.newPassword == req.body.reNewPassword) {
        User.updateOne(
          { email: req.session.user },
          { password: req.body.newPassword },
          (err) => {
            if (err) {
              console.log(err);
            }
          }
        );
        res.render("settings.ejs", {
          user: user.firstName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          message: "Password has been successfully changed!",
        });
      } else {
        res.render("settings.ejs", {
          user: user.firstName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          message: "Passwords do not match!",
        });
      }
    }
  });
});

app.post("/saveSettings", checkSignIn, (req, res) => {
  User.findOneAndUpdate(
    { email: req.session.user },
    { firstName: req.body.firstName, lastName: req.body.lastName },
    {
      returnOriginal: false,
    },
    (err, user) => {
      if (err) {
        console.log(err);
        res.render("settings.ejs", {
          user: user.firstName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          message: "There was an error please try again.",
        });
      } else {
        res.render("settings.ejs", {
          user: user.firstName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          message: "Settings have been updated!",
        });
      }
    }
  );
});

app.post("/post", checkSignIn, (req, res) => {
  if (req.body.privacy == undefined) {
    User.findOneAndUpdate(
      { email: req.session.user },
      { $push: { publicPosts: req.body.post } },
      {
        returnOriginal: false,
      },
      (err, user) => {
        if (err) {
          console.log(err + "no error");
        } else {
          console.log(user);
        }
      }
    );
    console.log("ok");
    res.redirect("/");
  } else {
    User.findOneAndUpdate(
      { email: req.session.user },
      { $push: { privatePosts: req.body.post } },
      {
        returnOriginal: false,
      },
      (err, user) => {
        if (err) {
          console.log(err + "no error");
        } else {
          console.log(user);
        }
      }
    );
    console.log("ok");
    res.redirect("/");
  }
});
app.listen("3000", () => {
  console.log("ALL GOOD!");
});
