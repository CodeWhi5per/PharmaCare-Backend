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
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.route('/').get(getMedicines).post(createMedicine);
router.get('/low-stock', getLowStockMedicines);
router.post('/bulk-reorder', bulkReorder);
router.route('/:id').get(getMedicine).put(updateMedicine).delete(deleteMedicine);
router.post('/:id/reorder', triggerReorder);

module.exports = router;

