const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');


router.get('/', commentController.getAllComments);
router.get('/:id', commentController.getCommentById);
router.post('/', commentController.addComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);
module.exports = router;
