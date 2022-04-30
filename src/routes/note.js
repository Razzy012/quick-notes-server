const express = require('express');
const router = express.Router();
const controlers = require('../controllers');
const middlewares = require('../middlewares')

router.post('/addNote', middlewares.verifyAccessToken, controlers.note.addNote);
router.post('/updateNote', middlewares.verifyAccessToken, controlers.note.updateNote);
router.post('/deleteNote', middlewares.verifyAccessToken, controlers.note.deleteNote);
router.get('/getAllNotes',middlewares.verifyAccessToken, controlers.note.getAllNotes);


module.exports = router;