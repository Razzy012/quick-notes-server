const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const noteSchema = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    title: String,
    note: String
});

const Note = model('Note', noteSchema);

module.exports = Note;