var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var HomePageSchema = new Schema({
  FirstBlog: { type: Schema.Types.ObjectId, ref: 'Post' },
  SecondBlog: { type: Schema.Types.ObjectId, ref: 'Post' },
  TopStories: [{ type: Schema.Types.ObjectId, ref: 'Post' }]

});

module.exports = mongoose.model('HomePage', HomePageSchema);
