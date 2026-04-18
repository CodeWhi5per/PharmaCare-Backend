const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getCommunications,
  createCommunication,
} = require('../controllers/suppliers.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/communications', getCommunications);
router.post('/communications', createCommunication);

router.route('/').get(getSuppliers).post(createSupplier);
router.route('/:id').get(getSupplier).put(updateSupplier).delete(deleteSupplier);

module.exports = router;

