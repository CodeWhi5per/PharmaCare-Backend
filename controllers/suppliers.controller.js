const Supplier = require('../models/Supplier');
const Communication = require('../models/Communication');
const Activity = require('../models/Activity');

// @desc  Get all suppliers
// @route GET /api/suppliers
exports.getSuppliers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
      ];
    }
    const suppliers = await Supplier.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single supplier
// @route GET /api/suppliers/:id
exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(200).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
};

// @desc  Create supplier
// @route POST /api/suppliers
exports.createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    await Activity.create({
      action: 'Added',
      entity: 'Supplier',
      entityId: supplier._id.toString(),
      entityName: supplier.name,
      performedBy: req.user._id,
    });
    res.status(201).json({ success: true, message: 'Supplier added', data: supplier });
  } catch (err) {
    next(err);
  }
};

// @desc  Update supplier
// @route PUT /api/suppliers/:id
exports.updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    await Activity.create({
      action: 'Updated',
      entity: 'Supplier',
      entityId: supplier._id.toString(),
      entityName: supplier.name,
      performedBy: req.user._id,
    });
    res.status(200).json({ success: true, message: 'Supplier updated', data: supplier });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete supplier
// @route DELETE /api/suppliers/:id
exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.status(200).json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc  Get communications for a supplier (or all recent)
// @route GET /api/suppliers/communications
exports.getCommunications = async (req, res, next) => {
  try {
    const comms = await Communication.find().sort({ createdAt: -1 }).limit(20);
    res.status(200).json({ success: true, data: comms });
  } catch (err) {
    next(err);
  }
};

// @desc  Create communication
// @route POST /api/suppliers/communications
exports.createCommunication = async (req, res, next) => {
  try {
    const comm = await Communication.create(req.body);
    res.status(201).json({ success: true, data: comm });
  } catch (err) {
    next(err);
  }
};

