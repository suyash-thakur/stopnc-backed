const mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');

var Schema = mongoose.Schema;

const tokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    token: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }
});

const Token = mongoose.model('Token', tokenSchema);


module.exports = Token;
