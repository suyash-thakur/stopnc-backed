var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var ExplorePage = new Schema({
  product: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  trending: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  exclusive: [{type: Schema.Types.ObjectId, ref: 'Post'}]
});

module.exports = mongoose.model('Explore', ExplorePage);
