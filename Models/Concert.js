const mongoose = require('mongoose');

const concertSchema = mongoose.Schema({
    titre: { type: String, require: true },
    artiste: { type: String, required: true },
    description: { type: String },
    date_debut: { type: Date, required: true },
    date_fin: { type: Date, required: true },
    nbr_place: { type: Number, required: true },
    reference: { type: String, required: true, unique: true }
})

module.exports = mongoose.model('Concert', concertSchema);