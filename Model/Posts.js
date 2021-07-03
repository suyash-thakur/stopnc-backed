var mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
var mongoosastic = require('mongoosastic');

  var Schema = mongoose.Schema;

  var blogSchema = new Schema({
    title: { type: String, es_indexed: true },
    image: [String],
    author: { type: String, es_indexed: true },
    authorId: { type: Schema.Types.ObjectId, ref: "user" },
    body: { type: String, es_indexed: true },
    date: { type: Date, default: Date.now },
    favs: Number,
    like: [{ type: Schema.Types.ObjectId, ref: "user" }],
    tag: { type: String, es_indexed: true },
    isVerified: { type: Boolean, default: false, required: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    click: { type: Number, default: 0 },
    isDraft: { type: Boolean, default: false, required: true },
  });
blogSchema.plugin(mongoosastic);
blogSchema.plugin(mongoosePaginate);
  module.exports = mongoose.model('Post', blogSchema);
