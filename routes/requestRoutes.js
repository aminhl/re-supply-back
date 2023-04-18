const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authController = require("../controllers/authController");


router.get('/', requestController.getAllRequests);
router.get('/:id', requestController.getRequestById);
router.delete('/:id',authController.protect, requestController.deleteRequest);
router.post('/', authController.protect, requestController.addRequest);
router.put('/approve/:id',authController.protect,requestController.approveRequest)
router.put('/:id', requestController.updateRequest);
module.exports = router;
