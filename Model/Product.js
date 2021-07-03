var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var productSchema = new Schema({
  name: { type: String, required: true},
  link: { type: String, required: true },
  description: {type: String},
  image: [{ type: String, required: true }],
  click: {type: Number, default: 0}
});
module.exports = mongoose.model('Product', productSchema);
