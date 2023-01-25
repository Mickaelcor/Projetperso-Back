const mongoose = require('mongoose');

const concertSchema = mongoose.Schema({
    titre: { type: String, require: true },
    artiste: { type: String, required: true },
    description: { type: String },


})

module.exports = mongoose.model('Concert', concertSchema);