const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Notification = require("../Model/Notification");
const Comment = require("../Model/Comment");
const Blog  = require("../Model/Posts");
const upload = require("../middleware/upload");
const cryptoRandomString = require('crypto-random-string');
var redis = require('redis');
const User = require("../Model/user");
const Token = require("../Model/Token");
const checkAuth = require("../middleware/check-auth");
const { populate } = require("../Model/user");
const Posts = require("../Model/Posts");
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
const { addSubscriber } = require("../helper/mailchimp");
const dotenv = require('dotenv');
dotenv.config();

var options = {
  auth: {
      api_key: process.env.SENDGRID_TOKEN
  }
}
var mailer = nodemailer.createTransport(sgTransport(options));

const router = express.Router();

router.put("/bookmark:id", checkAuth, (req, res, next) => {
  User.findOneAndUpdate({_id: req.params.id}, {$push: {bookmarked: req.body.postId}}).then(result => {
    if(result){
      res.status(200).json({message: "Bookmarked"});
    } else {
      res.status(500).json({message: "Error Bookmarked"});
    }
  });

});
router.put("/removebookmark:id", checkAuth, (req, res, next) => {
  User.findOneAndUpdate({_id: req.params.id}, {$pull: {bookmarked: req.body.postId}}).then(result => {
    if(result){
      res.status(200).json({message: "Bookmark Removed"});
    } else {
      res.status(500).json({message: "Error Removing"});
    }
  });

});
router.post("/forgot-password", (req, res, next) => {
  User.findOne({ email: req.body.email }, async function (err, user) {
    if (user) {
      const token = new Token({
        userId: user._id,
        token: cryptoRandomString({ length: 16 })
      });
      var tokenData = await token.save();
      let email = {
        from: "contact@stopnc.com",
        to: user.email,
        subject: "Reset Password STOPNC",
        html: `<!DOCTYPE html>
  <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
  </head>
  <body style="margin:0px; height: 100vh; background-image: url('https://res.cloudinary.com/diroilukd/image/upload/v1616968607/loginbackground_nvzyl9.png'); background-repeat: no-repeat; background-size:cover; width: 100%;">
      <div  style="padding: 15px; ">
      <div style="    background-color: #33AAAE;
      box-shadow: -10px 10px 6px #888;
      border-radius: 4px;
      padding-top: 20px;
      max-width: 700px;
      width: 100%;
      text-align: center;
      bottom: initial;
      margin: auto;
      margin-top: 40px;
      ">
      <img src="https://res.cloudinary.com/diroilukd/image/upload/v1616969785/STOPNCStyle_Your_Everyday_Life_iwkpfu.png" style="width: 150px;">
      <br>
      <div style="color: #fefefe; text-align: center;  padding: 10px; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
          <h1 >
              Reset The Password By Clicking On The Given Link !!
          </h1>
          <h5>
              By clicking the following link, you are conforming your email address
          </h5>
          <br>
          <a href="${
            "http://localhost:4200/forgot-password/" +
            tokenData.userId +
            "/" +
            tokenData.token
          }" style="padding-top: 10px; padding-bottom: 15px; padding-left: 20px; padding-right: 20px; background-color: #2D4A86; border-radius: 40px; font-size: 20px; cursor: pointer;">
              Confirm Email
          </a>
          <br>
          <br>
      </div>
      </div>
  </div>
      </body>

  </html>`,
      };
      mailer.sendMail(email, (err, info) => {
        if (err) {
          console.log(err);
        }
        console.log(info);
      });
      res.status(201).json({
        status: 1,
        message: "Email Sent",
        result: user
      });
    } else {
      res.status(200).json({
        status: 0,
        message: "User Not Found"
      })
    }
  });
});
router.post("/signup",  (req, res, next) => {
  User.findOne({ email: req.body.email }, function (err, user) {

    if (user) {

      res.status(400).send({ message: "Email Already Exist" });
    } else {
      console.log(req.body.email);

      bcrypt.hash(req.body.password, 10).then(hash => {
        const user = new User({
          name: req.body.name,
          email: req.body.email,
          password: hash,
          discription: '',
          about: ''
        });
        user
          .save()
          .then(async (result) => {
            const token = new Token({
              userId: result._id,
              token: cryptoRandomString({ length: 16 }),
            });
            var tokenData = await token.save();

            console.log(tokenData);
            let email = {
              from: "contact@stopnc.com",
              to: result.email,
              subject: "Email Verification STOPNC",
              html: `<!DOCTYPE html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
        </head>
        <body style="margin:0px; height: 100vh; background-image: url('https://res.cloudinary.com/diroilukd/image/upload/v1616968607/loginbackground_nvzyl9.png'); background-repeat: no-repeat; background-size:cover; width: 100%;">
            <div  style="padding: 15px; ">
            <div style="    background-color: #33AAAE;
            box-shadow: -10px 10px 6px #888;
            border-radius: 4px;
            padding-top: 20px;
            max-width: 700px;
            width: 100%;
            text-align: center;
            bottom: initial;
            margin: auto;
            margin-top: 40px;
            ">
            <img src="https://res.cloudinary.com/diroilukd/image/upload/v1616969785/STOPNCStyle_Your_Everyday_Life_iwkpfu.png" style="width: 150px;">
            <br>
            <div style="color: #fefefe; text-align: center;  padding: 10px; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
                <h1 >
                    Let's Confirm Your Email Address !!
                </h1>
                <h5>
                    By clicking the following link, you are conforming your email address
                </h5>
                <br>
                <a href="${
                  "http://localhost:4200/emailVerify/" +
                  tokenData.userId +
                  "/" +
                  tokenData.token
                }" style="padding-top: 10px; padding-bottom: 15px; padding-left: 20px; padding-right: 20px; background-color: #2D4A86; border-radius: 40px; font-size: 20px; cursor: pointer;">
                    Confirm Email
                </a>
                <br>
                <br>
            </div>
            </div>
        </div>
            </body>

        </html>`,
            };
            console.log(result.email);
            await addSubscriber(result.email, {
              name: result.name

            }, true);

            mailer.sendMail(email, (err, info) => {
              if (err) {
                console.log(err);
              }
              console.log(info);
            });
            res.status(201).json({
              message: "User created!",
              result: result,
            });
          })
      });
    }
  }).catch(err => {
  res.status(500).json({
    error: err
  });
});
});

router.put('/updatePassword/:id', (req, res) => {
  bcrypt.hash(req.body.password, 10).then(hash => {
    User.findOneAndUpdate({ _id: req.params.id }, { password: hash }, function (err, user) {
      if (err) {
        res.status(500).json({message: 'Error Updating Password'});
      } else {
        res.status(201).json({ message: 'Password Updated' });
      }
    });
  });
});
router.get('/checkEmail/:id/:token', (req, res) => {
  Token.findOne({ userId: req.params.id, token: req.params.token }, function (err, token) {
    if (!token) {
      res.status(200).json({status:0, message: 'Token Expired'});
    } else {
      res.status(200).json({status:1, message: 'Token Valid'})
    }
  });
});
router.put('/verifyEmail/:id/:token', (req, res) => {
  Token.findOne({ userId: req.params.id, token: req.params.token }, function (err, token) {
    if (!token) {
      res.status(400).json({ message: 'Cannot Verify' });
    } else {
      User.findOneAndUpdate({ _id: token.userId }, { emailVerified: true }, function (err, user) {
        if (user) {
          const token = jwt.sign(
            {email: user.email, userId: user._id},
           'letmein@26', {expiresIn: '365d'}
         );
          res.status(200).json({ message: 'Token Verified', token: token, user: user });
        }
        if (err) {
          res.status(400).json({ message: 'Cannot Verify' });
        }
      });
    }
  });
});

router.post('/resendToken', async (req, res) => {
  const token = new Token({
    userId: req.body.userId,
    token: cryptoRandomString({length: 16})
  });
  var tokenData = await token.save();
  let email = {
    from: "contact@stopnc.com",
    to: req.body.email,
    subject: "Email Verification STOPNC",
    html: `<!DOCTYPE html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    </head>
    <body style="margin:0px; height: 100vh; background-image: url('https://res.cloudinary.com/diroilukd/image/upload/v1616968607/loginbackground_nvzyl9.png'); background-repeat: no-repeat; background-size:cover; width: 100%;">
        <div  style="padding: 15px; ">
        <div style="    background-color: #33AAAE;
        box-shadow: -10px 10px 6px #888;
        border-radius: 4px;
        padding-top: 20px;
        max-width: 700px;
        width: 100%;
        text-align: center;
        bottom: initial;
        margin: auto;
        margin-top: 40px;
        ">
        <img src="https://res.cloudinary.com/diroilukd/image/upload/v1616969785/STOPNCStyle_Your_Everyday_Life_iwkpfu.png" style="width: 150px;">
        <br>
        <div style="color: #fefefe; text-align: center;  padding: 10px; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
            <h1 >
                Let's Confirm Your Email Address !!
            </h1>
            <h5>
                By clicking the following link, you are conforming your email address
            </h5>
            <br>
            <a href="${
              "http://localhost:4200/emailVerify/" +
              tokenData.userId +
              "/" +
              tokenData.token
            }" style="padding-top: 10px; padding-bottom: 15px; padding-left: 20px; padding-right: 20px; background-color: #2D4A86; border-radius: 40px; font-size: 20px; cursor: pointer;">
                Confirm Email
            </a>
            <br>
            <br>
        </div>
        </div>
    </div>
        </body>

    </html>`,
  };
  mailer.sendMail(email, (err, info) => {
   if (err) {
     console.log(err);
   }
 });
  res.status(201).json({
    message: "Token Send",
  });
});

router.post('/userEmail', (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      fetchedUser = user;
      bcrypt.compare(req.body.password, fetchedUser.password).then(result => {
        if(!result) {
            return res.status(401).json({
                message: "Auth failed"
            });
        }
      const token = jwt.sign(
          {email: fetchedUser.email, userId: fetchedUser._id},
         'letmein@26', {expiresIn: '365d'}
       );
       res.status(200).json({
           token: token

       });
      });
    } else {
      bcrypt.hash(req.body.password, 10).then(hash => {
        const user = new User({
          name: req.body.name,
          email: req.body.email,
          password: hash,
          discription: '',
          about: ''
        });
        user
          .save()
          .then(result => {
            const token = jwt.sign(
              {email: result.email, userId: result._id},
             'letmein@26', {expiresIn: '365d'}
           );
           res.status(200).json({
             token: token,
             result: result

           });
          })
      });

    }
  }

  )
});
router.post('/socialAuth', (req, res) => {
  User.findOne({ email: req.body.email }, async function (err, user) {
    if (user) {
      fetchedUser = user;
      console.log(fetchedUser);
      bcrypt
        .compare(req.body.email + "password123", user.password)
        .then((result) => {
          if (!result) {
            return res.status(403).json({
              message: "Wrong Password",
            });
          }
          const token = jwt.sign(
            { email: fetchedUser.email, userId: fetchedUser._id },
            "letmein@26",
            { expiresIn: "365d" }
          );
          res.status(200).json({
            token: token,
          });
        });
    } else {
      console.log(req.body.email);
      await addSubscriber((req.body.email).toString(), {
        name: req.body.name

      }, true);

      bcrypt.hash(req.body.email + "password123", 10).then((hash) => {
        const user = new User({
          name: req.body.name,
          email: req.body.email,
          password: hash,
          discription: "",
          about: "",
          emailVerified: true,
        });
        user
          .save()
          .then((result) => {
            const token = jwt.sign(
              { email: result.email, userId: result._id },
              "letmein@26",
              { expiresIn: "365d" }
            );
            res.status(200).json({
              token: token,
            });
          })
          .catch((err) => {
            res.status(500).json({
              error: err,
            });
          });
      });
    }
  });

});
router.post("/login",(req, res, next) => {
   let fetchedUser;
   User.findOne({ email: req.body.email })
    .then(user => {
         if (!user) {
          return res.status(403).json({
               message: "Wrong Email"
            });
           ;
         }
       fetchedUser = user;
       return bcrypt.compare(req.body.password, user.password);
    })
    .then(result => {
      if(!result) {
           res.status(403).json({
              message: "Wrong Email"
          });
      } else {
        if (fetchedUser !== undefined) {
          const token = jwt.sign(
            {email: fetchedUser.email, userId: fetchedUser._id},
           'letmein@26', {expiresIn: '365d'}
          );
          res.status(200).json({
            token: token

        });
        }

      }

    })
});
router.get("/userInfo:id", (req, res, next) => {
 User.findById(req.params.id).populate({path: 'bookmarked', model: 'Post', populate: { path: 'authorId', model: 'user'}}).then(async function(user) {
   if (user) {
     const notification = await Notification.find({recipient: req.params.id}).populate("originId").populate('refId').exec();
     res.status(200).json({User: user, Notification: notification});
   } else {
     res.status(404).json({ message: "Post not found!" });
   }
 });
});
router.put("/userUpdate:id",checkAuth, (req, res, next) => {

  User.findOneAndUpdate({ _id: req.params.id }, {
    _id: req.body.id,
    name: req.body.name,
    discription: req.body.cridential,
    about: req.body.about
  }).then(result => {
   res.status(200).json({ message: "Update successful!" });
 });
});

router.put("/follow:id", checkAuth, (req, res, next) => {
  User.findOneAndUpdate({_id: req.params.id}, {$push: {follower: req.body.followerId}}).then(result => {
    User.findOneAndUpdate({_id: req.body.followerId}, {$push: {following: req.params.id}}).then(result => {
      if(result){
        res.status(200).json({message: "Followed Successfully"});
      } else {
        res.status(500).json({message: "Error Following This Person"})
      }
    })
  })
})

router.put("/unfollow:id", checkAuth, (req, res, next) => {
  User.findOneAndUpdate({_id: req.params.id}, {$pull: {follower: req.body.followerId}}).then(result => {
    User.findOneAndUpdate({_id: req.body.followerId}, {$pull: {following: req.params.id}}).then(result => {
      if(result){
        res.status(200).json({message: "Followed Successfully"});
      } else {
        res.status(500).json({message: "Error Following This Person"})
      }
    })
  })
})
router.post("/notficationSeen:id", (req, res, next)=> {
  Notification.updateMany({recipient: req.params.id, isRead: false}, {isRead: true}, function(result, err) {
    res.status(201).json('Notification Updated');
  });
});
router.get("/commentUser:id", (req, res, next) => {

  Comment.find({'author': req.params.id }).populate('blog', 'title').exec(function(err, comment) {
    if(err) {
      res.status(500).json(err);
    } else {
      res.status(201).json({
        comment
      });
    }
  });
});


router.put("/unlike:id", checkAuth, (req, res, next) => {
  Blog.findOneAndUpdate({_id: req.params.id},{$pull: {like: req.body.userId}}).then(responce => {
    if (res){
      res.status(201).json({
        message: "UnLiked",
        result: responce
      });
    } else {
      res.status(500).json({
        message: "Error"
      });
    }

  });
});
router.get("/getBookmark:id", (req, res, next) => {
  User.findOne({_id: req.params.id}, "bookmarked").then (result => {
    if (result) {
      res.status(200).json({bookmark: result});

    }else {
      res.status(500).json({message: "Error Getting Bookmark"});
    }
  });

});
router.get("/followers:id", (req, res) => {
  User.findOne({ _id: req.params.id }, "follower").populate('follower').then(followers => {
    if (followers) {
      res.status(200).json({followers: followers});

    }else {
      res.status(500).json({message: "Error Getting Followers"});
    }
  });
});
router.get("/following:id", (req, res) => {
  User.findOne({ _id: req.params.id }, "following").populate('following').then(followers => {
    if (followers) {
      res.status(200).json({followers: followers});

    }else {
      res.status(500).json({message: "Error Getting Following"});
    }
  });
});

router.put("/removefollower:id", checkAuth, (req, res, next) => {
  User.findOneAndUpdate({ _id: req.params.id }, { $pull: { following: req.body.followerId } }).then(result => {
    User.findOneAndUpdate({ _id: req.body.followerId }, { $pull: { follower: req.params.id } }).then(result => {
      if (result) {
        res.status(200).json({ follower: result });
      } else {
        res.status(500).json({ message: "Error Following This Person" })
      }
    })
  })
});

router.post('/uploadProfileImage:id', upload.array('image', 1),  async (req, res) => {
  let id = req.params.id;

  await User.findOneAndUpdate({_id: req.params.id}, {profileImage: 'https://stopnc.s3.ap-south-1.amazonaws.com/profilepicture/' +  req.file});
  res.status(200).json({ image: 'https://stopnc.s3.ap-south-1.amazonaws.com/profilepicture/'  + req.file});

});

router.get("/searchBlog/:search/:page", (req, res) => {
  queryString = req.params.search;
  page = req.params.page;
  Posts.search({
    query_string: {
      query: queryString
    }
  },
    {
      from: 15 * page,
      size: 15,
      hydrate: true
    }, async function (err, results) {
      if (err) {
        res.status(501).json(err);
        return;
      }
      var userData = [];
      var userHits = [];
      for (var i = 0; i < results.hits.hits.length; i++) {
        if (results.hits.hits[i] !== undefined && results.hits.hits[i] !== null) {
          var user = await User.find({ _id: results.hits.hits[i].authorId }).select('name profileImage about').exec();
          userData.push(user);
          userHits.push(results.hits.hits[i]);
        }

      }
      res.status(200).json({result: userHits, userData: userData});
    }
  )
});
router.post("/recommendation", (req, res) => {
  Posts.search({

    more_like_this: {
      fields: [
        "title", "body", "author"
      ],
      //searchKeyword is a string variable for searching
      like:[{"_id":req.body.id}],
      min_term_freq: 1,
      min_doc_freq: 3,
      max_query_terms: 20
    }
  }, {hydrate: true,  from: 0,
    size: 7,
  }, async function  (err, results) {
    if (err) {
      res.status(501).json(err);
      return;
    }
    var blogData = [];
    var userData = [];

    for (var i = 0; i < results.hits.hits.length; i++) {

      if (results.hits.hits[i] !== undefined && results.hits.hits[i] !== null && blogData.length < 3) {
        var user = await User.find({ _id: results.hits.hits[i].authorId }).select('name profileImage about').exec();
        userData.push(user);

        blogData.push(results.hits.hits[i]);
      }
    }


    res.status(200).json({result: blogData, userData: userData});

    }

  );
});
router.get("/searchUser/:search/:page", (req, res) => {
  queryString = req.params.search;
  page = req.params.page;
  User.search({
    query_string: {
      query: queryString
    }
  },
    {
      from: 15 * page,
      size: 15,
      hydrate: true
    }, async function (err, results) {
      if (err) {
        res.status(501).json(err);
        return;
      }
      var userHits = [];
      for (var i = 0; i < results.hits.hits.length; i++) {
        if (results.hits.hits[i] !== undefined && results.hits.hits[i] !== null) {

          userHits.push(results.hits.hits[i]);
        }

      }
      res.status(200).json({result: userHits});
    }
  )
});

module.exports = router;
