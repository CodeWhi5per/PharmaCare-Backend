const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  triggerReorder,
  getLowStockMedicines,
  bulkReorder,
} = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// GET routes - all roles can view
router.get('/', getMedicines);
router.get('/low-stock', getLowStockMedicines);
router.get('/:id', getMedicine);

// POST routes - admin and manager only
router.post('/', authorize('admin', 'manager'), createMedicine);
router.post('/bulk-reorder', authorize('admin', 'manager'), bulkReorder);
router.post('/:id/reorder', authorize('admin', 'manager'), triggerReorder);

// PUT routes - admin and manager only
router.put('/:id', authorize('admin', 'manager'), updateMedicine);

// DELETE routes - admin only
router.delete('/:id', authorize('admin'), deleteMedicine);

module.exports = router;

