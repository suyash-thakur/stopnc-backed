const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User  = require("../Model/user");
const Notification = require("../Model/Notification");
const Blog  = require("../Model/Posts");
const checkAuth = require("../middleware/check-auth");
const uploadBlogPicture = require("../middleware/uploadblog");
const Comment = require("../Model/Comment");
const Product = require("../Model/Product");
const router = express.Router();
const aws = require('aws-sdk');
const app = express();
const dotenv = require('dotenv');
const elasticClient = require("../helper/elasticClient");

var redis = require('redis');

const mongoosePaginate = require('mongoose-paginate-v2');

   dotenv.config();

   aws.config.update({
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    accessKeyId: process.env.ACCESS_KEY_ID,
    region: 'ap-south-1'
   });
   var s3 = new aws.S3();
router.get("/blogs:id", (req, res, next) => {
  Blog.findOneAndUpdate({ _id: req.params.id }, { $inc: { click: 1 } }, {new: true}).populate('authorId').populate('products').then( blog => {
    if(blog) {
      Comment.find({'blog': req.params.id}).limit(5).populate('author').exec(function(err, comment) {
        if(err) {
          res.status(500).json(err);
        } else {
          res.status(201).json({
            Blog: blog, Comment: comment
          });
        }
      });
    }
  });
});
router.get("/getDraft/:id", (req, res, next) => {
  Blog.findOne({ _id: req.params.id }).then( blog => {
    if(blog) {

          res.status(201).json({
            Blog: blog
          });
    } else {
      res.status(501).json({
        err: 'Error Fetching Data'
      })
    }
  });
});
router.get("/comments:id", (req, res, next) => {
  Comment.find({'blog': req.params.id}).limit(5).populate('author').exec(function(err, comment) {
    if(err) {
      res.status(500).json(err);
    } else {
      res.status(201).json({
        Comment: comment
      });
    }
  });
});

router.get("/userBlog:id", (req, res, next) => {
  Blog.find({authorId: req.params.id}).populate('authorId').then(blog => {
    res.status(201).json({
      Blog: blog
    });
  }).catch(err => res.status(404).json({ err }));
});
router.get("/categories:id", (req, res, next) => {

  Blog.find({tag: req.params.id}).limit(5).populate('authorId').then(blog => {
    res.status(201).json(blog);
  }).catch(err => res.status(404).json({ err }));
});
router.get("/categories/:id/:page", (req, res, next) => {
  var page = req.params.page;
  var options = {
    populate: 'authorId',
    lean: true,
    limit: 5,
    offset: page * 5
  };
  Blog.paginate({tag: req.params.id}, options).then(blog => {
    res.status(201).json(blog);
  }).catch(err => res.status(404).json({ err }));
});
router.get("/comment/:id/:page", (req, res, next) => {
  var page = req.params.page;
  var options = {
    populate: 'author',
    lean: true,
    limit: 5,
    offset: page * 5
  };
  console.log("comment");
  Comment.paginate({ 'blog': req.params.id }, options).then(comment => {
    if (comment) {
      res.status(201).json({ comment: comment });
    } else {
      res.status(501).json({ err: 'error loading comments' });
    }
  });
});

router.get("/allBlog:page", (req, res, next) => {
  var page = req.params.page;
  var options = {
    populate: 'authorId',
    lean: true,
    limit: 5,
    offset: page * 5
  };
  Blog.paginate({}, options).then ( blog => {
    if(blog) {
      res.status(200).json(blog);
    } else {
      res.status(404).json("Blog not found");
    }
  });
});

router.post("/createDraft", checkAuth, (req, res) => {
  const blog = new Blog({
    title: req.body.title,
    image: req.body.image,
    author: req.body.author,
    body: req.body.body,
    authorId: req.body.authorId,
    tag: req.body.tag,
    isDraft: true,
  });
  blog.save().then( async function (result) {
    let user =  await User.findById(req.body.authorId).populate('follower').exec();

        res.status(201).json({
          message: "Created a new draft",
          result: blog
        });

  }).catch(err => {
    res.status(500).json({
      error: err
    });
  });
});
router.get("/draft:id", checkAuth, (req, res) => {
  Blog.find({ authorId: req.params.id, isDraft: true })
    .then((blog) => {
      res.status(201).json({
        Blog: blog,
      });
    })
    .catch((err) => res.status(404).json({ err }));
});



router.post("/deleteBlog/:id", checkAuth, (req, res) => {
  Blog.findOneAndRemove({ _id: req.params.id }).then((blog) => {
    res.status(201).json({
      blog: Blog,
    });
  });
});
router.post("/createBlog", checkAuth,  async function (req, res)  {

  const blog = new Blog ({
    title: req.body.title,
    image: req.body.image,
    author: req.body.author,
    body: req.body.body,
    authorId: req.body.authorId,
    tag: req.body.tag
  });

  blog.save().then( async function (result) {
    let user =  await User.findById(req.body.authorId).populate('follower').exec();
    let blog = result;
    if (user.follower.length != 0) {


      for (const follower of user.follower) {

        let newNotification = new Notification({
          message: 'posted a new blog',
          recipient: follower._id,
          refId: blog._id,
          type: 'Post',
          originId: req.body.authorId
        })
        await newNotification.save();
      }
        res.status(201).json({
          message: "Created a new blog and notification",
          result: blog
        });
    } else {
      res.status(201).json({
        message: "Created a new blog",
        result: blog
      });
    }

  }).catch(err => {
    res.status(500).json({
      error: err
    });
  });
});
router.put("/draftPublish/:id", checkAuth, (req, res, next) => {
  Blog.findOneAndUpdate(
    { _id: req.params.id },
    {
      title: req.body.title,
      image: req.body.image,
      author: req.body.author,
      body: req.body.body,
      authorId: req.body.authorId,
      tag: req.body.tag,
      isDraft: false,
    }
  )
    .then(async (result) => {
      let user = await User.findById(req.body.authorId)
        .populate("follower")
        .exec();
      let blog = result;
      if (user.follower.length != 0) {
        for (const follower of user.follower) {
          let newNotification = new Notification({
            message: "posted a new blog",
            recipient: follower._id,
            refId: blog._id,
            type: "Post",
            originId: req.body.authorId,
          });
          await newNotification.save();
        }
        res.status(201).json({
          message: "Created a new blog and notification",
          result: blog,
        });
      } else {
        res.status(201).json({
          message: "Created a new blog",
          result: blog,
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.put("/updateDraft/:id", checkAuth, (req, res) => {
  Blog.findOneAndUpdate(
    { _id: req.params.id },
    {
      title: req.body.title,
      image: req.body.image,
      author: req.body.author,
      body: req.body.body,
      authorId: req.body.authorId,
      tag: req.body.tag,
      isDraft: true,
    }
  ).then((blog) => {
    if (blog) {
      res.status(200).json({ blog: blog });
    } else {
      res.status(501).json({ msg: "Error Updating Draft" });
    }
  });
});

router.post("/comment:id", checkAuth, (req, res, next) => {
  const comment = new Comment({
    body: req.body.body,
    author: req.body.postedBy,
    blog: req.params.id
  });
  comment.save().then( async (result) => {
    var comment = await result.populate('author').execPopulate();
    res.status(201).json({
      message: "comment Created",
      result: comment
    });
  }).catch(err => {
    res.status(500).json({
      error: err
    });
  });
});
router.put("/like:id", checkAuth, (req, res, next) => {
  Blog.findOneAndUpdate({_id: req.params.id},{$push: {like: req.body.userId}}).then( function(responce) {
    if (responce){
      let newNotification = new Notification({
        message: 'liked your blog',
        recipient: req.body.authId,
        refId: req.params.id,
        type: 'Post',
        originId: req.body.userId

      });
      newNotification.save().then( function (resp){
        res.status(201).json({
          message: "Liked",
          result: responce
        });
      });

    } else {
      res.status(500).json({
        message: "Error"
      });
    }

  }).catch(err => {
    res.status(500).json({
      error: err
    });
  });
});
router.put("/Commentlike:id", checkAuth, (req, res, next) => {
  Comment.findOneAndUpdate({_id: req.params.id},{$push: {like: req.body.userId}}).then( function(responce) {
    if (responce){
      let newNotification = new Notification({
        message: 'liked your comment',
        recipient: req.body.authId,
        refId: req.body.refId,
        type: 'Post',
        originId: req.body.userId
      });
      newNotification.save().then( function (resp){
        res.status(201).json({
          message: "Liked",
          result: responce
        });
      });

    } else {
      res.status(500).json({
        message: "Error"
      });
    }

  }).catch(err => {
    res.status(500).json({
      error: err
    });
  });
});

router.post('/uploadBlogImage', checkAuth, uploadBlogPicture.array('image', 7),  async (req, res) => {
  res.status(200).json({ image: 'https://stopnc.s3.ap-south-1.amazonaws.com/blogImage/'  + req.file});


});
router.post('/removeBlogImage', checkAuth, (req, res) => {
  var params = {
    Bucket: 'stopnc',
    Key: req.body.key

  };
  s3.deleteObject(params, function(err, data) {
    if (err) res.status(500).json({error: err});  // error
    else res.status(200).json({ message: 'deleted' });                // deleted
  });
});

router.put('/blogClick/:id', (req, res) => {
  Product.findOneAndUpdate({ _id: req.params.id }, { $inc: { 'click': 1 } }, { new: true }).then(products => {
    res.status(200).json({ message: 'Product Clicked' });
  });
});

module.exports = router;
