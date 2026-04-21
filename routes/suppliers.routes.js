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
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Communications - admin and manager only
router.get('/communications', authorize('admin', 'manager'), getCommunications);
router.post('/communications', authorize('admin', 'manager'), createCommunication);

// GET routes - all roles can view
router.get('/', getSuppliers);
router.get('/:id', getSupplier);

// POST routes - admin and manager only
router.post('/', authorize('admin', 'manager'), createSupplier);

// PUT routes - admin and manager only
router.put('/:id', authorize('admin', 'manager'), updateSupplier);

// DELETE routes - admin only
router.delete('/:id', authorize('admin'), deleteSupplier);

module.exports = router;

