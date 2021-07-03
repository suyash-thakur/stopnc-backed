const express = require("express");
const User  = require("../Model/user");
const Notification = require("../Model/Notification");
const Blog  = require("../Model/Posts");
const checkAuth = require("../middleware/check-auth");
const uploadBlogPicture = require("../middleware/uploadblog");
const Comment = require("../Model/Comment");
const Product = require("../Model/Product");
const HomePage = require("../Model/HomePage");
const uploadProductImage = require("../middleware/uploadProduct");
const Explore = require('../Model/Explore');
const router = express.Router();
const redisClient = require("../helper/redisClient");
const elasticClient = require("../helper/elasticClient");
const { promisify } = require('util');

const GET_ASYNC = promisify(redisClient.get).bind(redisClient);
const SET_ASYNC = promisify(redisClient.set).bind(redisClient);

router.get('/countUser', async (req, res, next) => {
  User.countDocuments({}, function (err, count) {
    if (err) {
      res.status(501).json(err);
    }
    res.status(201).json(count);
  });
});

router.get('/blogCount', async (req, res, next) => {
  Blog.countDocuments({}, function (err, count) {
    if (err) {
      res.status(501).json(err);
    }
    res.status(201).json(count);
  });
});
router.get('/productCount', async (req, res, next) => {
  Product.countDocuments({}, function (err, count) {
    if (err) {
      res.status(501).json(err);
    }
    res.status(201).json(count);
  });
});

router.post('/homepageInfo', (req, res, next) => {
  const blog = new HomePage({
    FirstBlog: req.body.blog1,
    SecondBlog: req.body.blog2,
    TopStories: req.body.topStories
  });
  blog.save(function (err, blog) {
    if (err) {
      res.status(501).json(err);
    } else {
      res.status(201).json({ blog: blog });
    }
  });
});

router.post('/createProduct', (req, res) => {
  const product = new Product({
    name: req.body.name,
    link: req.body.link,
    description: req.body.description,
    image: req.body.image
  });
  product.save(function (err, prod) {
    if (err) {
      res.status(500).json(err);
    } else {
      res.status(201).json({ product: prod });
    }
  })
});

router.get('/homepageInfo', async (req, res) => {
  const cachedData = await GET_ASYNC('homepageInfo');
  if (cachedData) {
    console.log("using cache data");
    var homepageCache = JSON.parse(cachedData);
    res.status(201).json({ home: homepageCache });

  } else {
    let homepage = (await HomePage.find({}).populate('FirstBlog').populate('SecondBlog').populate({ path: 'TopStories', populate: { path: 'authorId', select: 'name about discription profileImage' } }).sort({ _id: -1 }).limit(1))[0];
    const saveCacheData = await SET_ASYNC('homepageInfo', JSON.stringify(homepage), "EX", 86400);
    res.status(201).json({ home: homepage });
  }
});
router.get("/allBlog", (req, res, next) => {
  Blog.find().populate('authorId', 'name').then ( blog => {
    if(blog) {
      res.status(200).json(blog);
    } else {
      res.status(404).json("Blog not found");
    }
  });
});
router.get("/unverifiedBlog", (req, res, next) => {
  Blog.find({isVerified: false}).populate('authorId').then ( blog => {
    if(blog) {
      res.status(200).json(blog);
    } else {
      res.status(404).json("Blog not found");
    }
  });
});

router.get('/productInfo', (req, res) => {
  Product.find().then(blog => {
    if (blog) {
      res.status(201).json({blog: blog});
    } else {
      res.status(501).json({error: "cannot fetch blog"})
    }
  })
});

router.put('/verify:id', (req, res) => {
  Blog.findOneAndUpdate({ _id: req.params.id }, { isVerified: true, products: req.body.product }).then(blog => {
    if (blog) {
      res.status(201).json({ blog: blog });
    } else {
      res.status(501).json({ error: "Error Creating Blog" });
    }
  });
});
router.post('/deleteProduct:id', (req, res) => {
  Product.findOneAndRemove({ _id: req.params.id }).then(product => {
    res.status(200).json({ message: 'Product Deleted', product: product });
  });
});

router.post('/uploadProductImage', uploadProductImage.array('image', 7),  async (req, res) => {
  res.status(200).json({ image: 'https://stopnc.s3.ap-south-1.amazonaws.com/profilepicture/'  + req.file});
});

router.post('/createExplore', (req, res) => {
  const ExplorePage = new Explore({
    product: req.body.product,
    trending: req.body.trending,
    exclusive: req.body.exclusive
  });
  ExplorePage.save(function (err, explore) {
    if (err) {
      res.status(500).json({ err });
    } else {
      res.status(201).json({ explore: explore });
    }
  })
});

router.get('/explore', async (req, res) => {
  const cachedData = await GET_ASYNC('explore');
  if (cachedData) {
    console.log("using cache data");
    var explorePageCache = JSON.parse(cachedData);
    res.status(201).json({ explore: explorePageCache });


  }
  else {
    let explore = (await Explore.find().populate('product').populate('trending').populate('exclusive').sort({ _id: -1 }).limit(1))[0];
    const saveCacheData = await SET_ASYNC('explore', JSON.stringify(explore), "EX", 86400);
    res.status(201).json({ explore: explore });
  }


});

router.put('/verifyBlogger:id', (req, res) => {
  User.findOneAndUpdate({ _id: id }, { isBlogger: true }).then(user => {
    res.status(201).json({ user: user });
  });
});

router.get('/allUser', (req, res) => {
  User.find({isBlogger: false}).then(user => {
    res.status(201).json({ users: user });
  });
});

router.get('/topBlog', async (req, res) => {
  // Blog.find({ isVerified: true }).distinct("authorId").sort({ click: "desc" }).populate('authorId').limit(5).then(blog => {
  //   res.status(200).json(blog);
  // });
  const cachedData = await GET_ASYNC('topBlog');
  if (cachedData) {
    console.log("using cache data");
    var topBlogCache = JSON.parse(cachedData);
    res.status(201).json(topBlogCache);


  } else {
    var blog = await Blog.aggregate([{ $match: { 'isVerified': true } },
    {
      $group: {
        _id: '$id',
        authorId: { "$first": "$authorId" },
        clicks: { "$sum": "$click" }
      }
    },
    { $sort: { clicks: 1 } },

    {
      $limit: 5
    },
    {
      $lookup: {
        from: 'users',
        localField: 'authorId',
        foreignField: '_id',
        as: 'authorId'
      }
    },
    {
      $unwind: '$authorId',

    }
    ]).exec();
    const saveCacheData = await SET_ASYNC('topBlog', JSON.stringify(blog), "EX", 86400);
    res.status(201).json(blog);

  }

});

router.get('/trendingProduct', (req, res) => {
  Product.find({}).sort('-click').limit(3).then(product => {
    res.status(200).json(product);
  });
});

router.get('/remove', async (req, res) => {
  await redisClient.del('explore');
  await redisClient.del('topBlog');

  await redisClient.del('homepageInfo');

  res.status(201).json({ message: 'Cache cleared' });

})
module.exports = router;
