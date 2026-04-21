const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orders.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// GET routes - all roles can view
router.get('/', getOrders);
router.get('/:id', getOrder);

// POST routes - admin and manager only
router.post('/', authorize('admin', 'manager'), createOrder);

// PUT routes - admin and manager only (approve orders)
router.put('/:id/status', authorize('admin', 'manager'), updateOrderStatus);

// DELETE routes - admin and manager only (cancel orders)
router.delete('/:id', authorize('admin', 'manager'), cancelOrder);

module.exports = router;

