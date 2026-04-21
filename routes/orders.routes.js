const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orders.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/').get(getOrders).post(createOrder);
router.route('/:id').get(getOrder).delete(cancelOrder);
router.put('/:id/status', updateOrderStatus);

module.exports = router;

