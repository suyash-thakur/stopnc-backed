var mongoose = require('mongoose'),
 mongoosastic = require('mongoosastic');

const mongoosePaginate = require('mongoose-paginate-v2');

var Schema = mongoose.Schema;

var commentSchema = new Schema({
  body: {type: String},
  author: {type: Schema.Types.ObjectId, ref: 'user'},
  date: {type: Date, default: Date.now},
  blog: {type: Schema.Types.ObjectId, ref: 'Post'},
  like: [{type: Schema.Types.ObjectId, ref: 'user'}]

})
commentSchema.plugin(mongoosastic);
commentSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Comment', commentSchema);
