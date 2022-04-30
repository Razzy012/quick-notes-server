const models = require('../models');
const { errorHandler, withTransaction } = require('../util');
const { HttpError } = require('../error');

const addNote = errorHandler(withTransaction(async (req, res, session) => {
    if(req.body.title === '' && req.body.note === '') {
        throw new HttpError(403, 'Title or note required');
    }

    const noteDoc = models.Note({
        owner: req.userId,
        title: req.body.title,
        note: req.body.note
    });

    await noteDoc.save({session});

    return { id: noteDoc._id };
}));

const updateNote = errorHandler(withTransaction(async (req, res, session) => {
    if(req.body.title === '' && req.body.note === '') {
        throw new HttpError(403, 'Title or note required');
    }

    await models.Note.updateOne({_id: req.body.id}, {title: req.body.title, note: req.body.note});

    return { success: true };
}));


const deleteNote = errorHandler(withTransaction(async (req, res, session) => {
    await models.Note.findById(req.body.id).deleteOne({session});

    return { success: true };
}));

const getAllNotes = errorHandler(async (req, res) => {
    const notesDocs = await models.Note.find({ owner: req.userId }).exec();

    let result = [];
    notesDocs.forEach(note => {
        result.push({
            id: note._id,
            title: note.title,
            note: note.note
        })
    })

    return result;
});

module.exports = {
    addNote,
    updateNote,
    deleteNote,
    getAllNotes
};