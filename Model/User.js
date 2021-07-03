const mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');

var Schema = mongoose.Schema;


const userSchema = mongoose.Schema({
  name: { type: String, require: true, es_indexed:true },
  email: { type: String, required: true, unique: true, es_indexed:true },
  password: { type: String, required: true },
  discription: { type: String, es_indexed:true},
  about: { type: String, es_indexed:true },
  follower: [{type: Schema.Types.ObjectId, ref: "User"}],
  following: [{type: Schema.Types.ObjectId, ref: "User"}],
  bookmarked: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  profileImage: { type: String, default: 'https://stopnc.s3.ap-south-1.amazonaws.com/profilepicture/icons8-male-user-100.png' },
  isBlogger: { type: Boolean, default: false, required: true },
  emailVerified: { type: Boolean, default: false, required: true },
  isRequestBlogger: { type: Boolean, default: false}

});
userSchema.plugin(mongoosastic);
const User = mongoose.model('user', userSchema);


module.exports = User;

module.exports = mongoose.model("User", userSchema);
