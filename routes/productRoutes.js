const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();

router.route("/").post(productController.addProduct).get(productController.getAllProducts);
router.route("/:id").delete(productController.deleteProduct).patch(productController.updateProduct);
router.route("/accept/:id").patch(productController.acceptProduct);
router.route("/reject/:id").patch(productController.rejectProduct);
router.route("/accepted").get(productController.getAcceptedProducts);
router.route("/pending").get(productController.getPendingProducts);
router.route("/get/:id").get(productController.getProduct);
module.exports = router;