const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const session = require("express-session");
const cookieParser = require("cookie-parser");
const { reset } = require("nodemon");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const app = express();
const router = express.Router();
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
  isPrivate: String,
  publicPosts: [{ post: String }],
  privatePosts: [{ post: String }],
});

const User = mongoose.model("User", userSchema);

const postSchema = new Schema({
  _id: String,
  author: String,
  firstName: String,
  lastName: String,
  post: String,
  isPrivate: String,
});

const Post = mongoose.model("Post", postSchema);

// APP.USE ------------------
app.use(cookieParser());
app.use(
  session({ secret: "SecretKey!", resave: true, saveUninitialized: true })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());

app.use(express.static("public"));

app.get("/user/:id", checkSignIn, (req, res, next) => {
  User.findOne({ email: req.params.id }, (err, user) => {
    if (req.params.id == req.session.user) {
      res.redirect("/profile");
    } else if (user != req.session.user) {
      res.render("othersProfile.ejs", {
        user: user.firstName,
        posts: user.publicPosts,
        mainUser: user,
      });
    } else if (err) {
      console.log(err);
    }
  });
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
  User.findOne({ email: req.session.user }, (err, user) => {
    if (user) {
      Post.find({ isPrivate: "public" }, (err, posts) => {
        if (err) {
          console.log(err);
        } else {
          res.render("home.ejs", {
            user: user.firstName,
            posts: posts,
            sessionUser: req.session.user,
          });
        }
      });
    }
  });
});
app.get("/settings", checkSignIn, (req, res) => {
  User.findOne({ email: req.session.user }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      res.render("settings.ejs", {
        user: user,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        message: null,
        message2: null,
      });
    }
  });
});

app.get("/profile", checkSignIn, (req, res) => {
  User.findOne({ email: req.session.user }, (err, user) => {
    res.render("profile.ejs", {
      user: user.firstName,
      posts: user.publicPosts,
      mainUser: user,
      privatePosts: user.privatePosts,
    });
  });
});

// app.get("/othersProfile", (req, res) => {
//   console.log(userProfile);
// });

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
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
          const user = new User({
            firstName: req.body.fName,
            lastName: req.body.lName,
            email: req.body.email,
            password: hash,
            isPrivate: "public",
            privatePosts: [],
            publicPosts: [],
          });

          user.save();
          req.session.user = user.email;
          res.redirect("/");
        });
        // if no user is found check passwords make sure they are the same if they are then create a new user
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
      bcrypt.compare(req.body.password, user.password, function (err, result) {
        if (result == true) {
          req.session.user = user.email;
          res.redirect("/");
        } else {
          res.render("index.ejs", {
            message: "Password is incorrect. Try again",
          });
        }
      });
    } else {
      console.log(err);
    }
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy(function () {});
  res.render("index.ejs", { message: "You've logged out. Come back soon!" });
});

app.post("/changePassword", checkSignIn, (req, res) => {
  User.findOne({ email: req.session.user }, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else if (user) {
      bcrypt.compare(
        req.body.currentPassword,
        user.password,
        function (err, result) {
          if (result) {
            bcrypt.hash(req.body.newPassword, saltRounds, function (err, hash) {
              User.updateOne(
                { email: req.session.user },
                { password: hash },
                (err) => {
                  if (err) {
                    console.log(err);
                  }
                }
              );
            });

            res.render("settings.ejs", {
              user: user,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              message: "Password has been successfully changed!",
              message2: null,
            });
          } else {
            res.render("settings.ejs", {
              user: user,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              message: "Passwords do not match!",
              message2: null,
            });
          }
        }
      );
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
          user: user,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          message: "There was an error please try again.",
          message2: null,
        });
      } else {
        res.render("settings.ejs", {
          user: user,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          message: "Settings have been updated!",
          message2: null,
        });
      }
    }
  );
});

app.post("/post", checkSignIn, (req, res) => {
  if (req.body.privacy == undefined) {
    User.findOneAndUpdate(
      { email: req.session.user },
      { $push: { publicPosts: { post: req.body.post } } },
      {
        returnOriginal: false,
      },
      (err, user) => {
        if (err) {
          console.log(err);
        } else {
          let publicPosts = user.publicPosts;
          if (user.isPrivate == "private") {
            // console.log(user.publicPosts[publicPosts.length - 1]._id);
            Post.create(
              {
                _id: user.publicPosts[publicPosts.length - 1]._id,
                author: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                post: req.body.post,
                isPrivate: "private",
              },
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  setTimeout(() => {
                    res.redirect("/");
                  }, 1000);
                }
              }
            );
          } else if (user.isPrivate == "public") {
            Post.create(
              {
                _id: user.publicPosts[publicPosts.length - 1]._id,
                author: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                post: req.body.post,
                isPrivate: "public",
              },
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  setTimeout(() => {
                    res.redirect("/");
                  }, 1000);
                }
              }
            );
          }
        }
      }
    );
  } else {
    User.findOneAndUpdate(
      { email: req.session.user },
      { $push: { privatePosts: { post: req.body.post } } },
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

    res.redirect("/");
  }
});

app.post("/deletePublicPost", checkSignIn, (req, res) => {
  if (req.body.postId) {
    User.findOneAndUpdate(
      { email: req.session.user },
      { $pull: { publicPosts: { _id: req.body.postId } } },
      { returnOriginal: false },
      (err, user) => {
        if (err) {
          console.log(err);
        } else {
          Post.deleteOne({ _id: req.body.postId }, (err) => {
            if (err) {
              console.log(err);
            } else {
              setTimeout(() => {
                res.redirect("/profile");
              }, 1000);
            }
          });
        }
      }
    );
  } else if (req.body.homePostId) {
    User.findOneAndUpdate(
      { email: req.session.user },
      { $pull: { publicPosts: { _id: req.body.homePostId } } },
      { returnOriginal: false },
      (err, user) => {
        if (err) {
          console.log(err);
        } else {
          Post.deleteOne({ _id: req.body.homePostId }, (err) => {
            if (err) {
              console.log(err);
            } else {
              setTimeout(() => {
                res.redirect("/");
              }, 1000);
            }
          });
        }
      }
    );
  }
});

app.post("/deletePrivatePost", checkSignIn, (req, res) => {
  User.findOneAndUpdate(
    { email: req.session.user },
    { $pull: { privatePosts: { _id: req.body.postId } } },
    { returnOriginal: false },
    (err, user) => {
      if (err) {
        console.log(err);
      } else {
        setTimeout(() => {
          res.redirect("/profile");
        }, 1000);
      }
    }
  );
});

app.post("/deleteAccount", checkSignIn, (req, res) => {
  User.findOne({ email: req.session.user }, (err, user) => {
    if (user) {
      bcrypt.compare(
        req.body.currentPassword,
        user.password,
        function (err, result) {
          if (result) {
            User.deleteOne(
              { email: req.session.user },
              { returnOriginal: false },
              (err) => {
                if (err) {
                  console.log(err);
                } else {
                  Post.remove(
                    { author: req.session.user },
                    { returnOriginal: false },
                    (err) => {
                      if (err) {
                        console.log(err);
                      } else {
                        res.render("index.ejs", {
                          message:
                            "You have deleted your account successfully!",
                        });
                      }
                    }
                  );
                }
              }
            );
          } else {
            res.render("settings.ejs", {
              user: user,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              message: "Password is incorrect",
              message2: null,
            });
          }
        }
      );
    }
  });
});

app.post("/changePrivacySettings", checkSignIn, (req, res) => {
  User.findOneAndUpdate(
    { email: req.session.user },
    { isPrivate: req.body.privacySetting },
    { returnOriginal: false },
    (err, user) => {
      if (err) {
        console.log(err);
      } else {
        Post.updateMany(
          { author: req.session.user },
          { isPrivate: req.body.privacySetting },
          { returnOriginal: false },
          (err, posts) => {
            if (err) {
              console.log(err);
            } else {
              res.render("settings.ejs", {
                user: user,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                message: null,
                message2: "Privacy settings have been changed!",
              });
            }
          }
        );
      }
    }
  );
});
app.listen(process.env.PORT || "3000", () => {});
