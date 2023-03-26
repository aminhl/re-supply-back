const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authController = require("../controllers/authController");


router.get('/', requestController.getAllRequests);


router.get('/:id', requestController.getRequestById);


router.post('/', authController.protect, requestController.addRequest);


router.put('/:id', requestController.updateRequest);


router.delete('/:id', requestController.deleteRequest);

module.exports = router;
