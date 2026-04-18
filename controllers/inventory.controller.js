const Medicine = require('../models/Medicine');
const Activity = require('../models/Activity');
const runAlertEngine = require('../utils/alertEngine');

// @desc  Get all medicines (with search & pagination)
// @route GET /api/inventory
exports.getMedicines = async (req, res, next) => {
  try {
    const { search, status, category, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (category) filter.category = { $regex: category, $options: 'i' };

    const total = await Medicine.countDocuments(filter);
    const medicines = await Medicine.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: medicines,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single medicine
// @route GET /api/inventory/:id
exports.getMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    res.status(200).json({ success: true, data: medicine });
  } catch (err) {
    next(err);
  }
};

// @desc  Add a new medicine
// @route POST /api/inventory
exports.createMedicine = async (req, res, next) => {
  try {
    // Parse consumptionRate from consumption string like "12/day"
    const body = { ...req.body };
    if (body.consumption && !body.consumptionRate) {
      const match = body.consumption.match(/(\d+(\.\d+)?)/);
      if (match) body.consumptionRate = parseFloat(match[1]);
    }

    const medicine = await Medicine.create(body);

    await Activity.create({
      action: 'Added',
      entity: 'Medicine',
      entityId: medicine._id.toString(),
      entityName: medicine.name,
      performedBy: req.user._id,
      meta: { stock: medicine.stock, category: medicine.category },
    });

    // Run alert engine
    await runAlertEngine(medicine, req.user.inventoryThresholds?.expiryWarningDays);

    res.status(201).json({ success: true, message: 'Medicine added successfully', data: medicine });
  } catch (err) {
    next(err);
  }
};

// @desc  Update a medicine
// @route PUT /api/inventory/:id
exports.updateMedicine = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.consumption && !body.consumptionRate) {
      const match = body.consumption.match(/(\d+(\.\d+)?)/);
      if (match) body.consumptionRate = parseFloat(match[1]);
    }

    const medicine = await Medicine.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });

    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    await Activity.create({
      action: 'Updated',
      entity: 'Medicine',
      entityId: medicine._id.toString(),
      entityName: medicine.name,
      performedBy: req.user._id,
    });

    await runAlertEngine(medicine, req.user.inventoryThresholds?.expiryWarningDays);

    res.status(200).json({ success: true, message: 'Medicine updated successfully', data: medicine });
  } catch (err) {
    next(err);
  }
};

// @desc  Delete a medicine
// @route DELETE /api/inventory/:id
exports.deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    await Activity.create({
      action: 'Deleted',
      entity: 'Medicine',
      entityId: medicine._id.toString(),
      entityName: medicine.name,
      performedBy: req.user._id,
    });

    res.status(200).json({ success: true, message: 'Medicine deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc  Get low stock medicines (below minimum stock level)
// @route GET /api/inventory/low-stock
exports.getLowStockMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({
      $expr: { $lt: ['$stock', '$minStock'] }
    }).sort({ stock: 1 });

    const lowStockData = medicines.map(med => {
      const reorderQty = med.minStock * 2 - med.stock; // Default: reorder to 2x minimum
      return {
        id: med._id,
        name: med.name,
        currentStock: med.stock,
        minStock: med.minStock,
        reorderQty: Math.max(reorderQty, 0),
        supplier: med.supplier || 'N/A',
        unitPrice: med.unitPrice || 0,
        category: med.category,
        status: med.status,
      };
    });

    res.status(200).json({ success: true, data: lowStockData });
  } catch (err) {
    next(err);
  }
};

// @desc  Trigger reorder for a medicine
// @route POST /api/inventory/:id/reorder
exports.triggerReorder = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    const Alert = require('../models/Alert');
    const orderId = `ORD-${Date.now()}`;
    const orderQty = req.body.quantity || (medicine.minStock * 2 - medicine.stock);

    await Alert.create({
      type: 'info',
      category: 'Auto-Reorder',
      title: `Auto-Reorder Triggered - ${medicine.name}`,
      message: `Automatic reorder placed for ${orderQty} units. Order ID: ${orderId}. Supplier: ${medicine.supplier || 'N/A'}.`,
      medicine: medicine.name,
      orderQty,
      orderId,
      supplier: medicine.supplier,
    });

    await Activity.create({
      action: 'Reordered',
      entity: 'Medicine',
      entityId: medicine._id.toString(),
      entityName: medicine.name,
      performedBy: req.user._id,
      meta: { orderId, orderQty },
    });

    res.status(200).json({ success: true, message: 'Reorder triggered', data: { orderId, orderQty } });
  } catch (err) {
    next(err);
  }
};

// @desc  Generate bulk reorder for multiple medicines
// @route POST /api/inventory/bulk-reorder
exports.bulkReorder = async (req, res, next) => {
  try {
    const { medicines } = req.body; // Array of { id, quantity }

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'No medicines provided for reorder' });
    }

    const Alert = require('../models/Alert');
    const orderId = `ORD-${Date.now()}`;
    const orderDetails = [];

    for (const item of medicines) {
      const medicine = await Medicine.findById(item.id);
      if (medicine) {
        orderDetails.push({
          name: medicine.name,
          quantity: item.quantity,
          supplier: medicine.supplier || 'N/A',
          unitPrice: medicine.unitPrice || 0,
          totalCost: (medicine.unitPrice || 0) * item.quantity,
        });

        await Activity.create({
          action: 'Reordered',
          entity: 'Medicine',
          entityId: medicine._id.toString(),
          entityName: medicine.name,
          performedBy: req.user._id,
          meta: { orderId, orderQty: item.quantity },
        });
      }
    }

    const totalCost = orderDetails.reduce((sum, item) => sum + item.totalCost, 0);

    await Alert.create({
      type: 'info',
      category: 'Auto-Reorder',
      title: `Bulk Purchase Order Created`,
      message: `Purchase order ${orderId} created for ${orderDetails.length} medicines. Total cost: $${totalCost.toFixed(2)}.`,
      orderId,
    });

    res.status(200).json({
      success: true,
      message: 'Bulk reorder generated successfully',
      data: { orderId, items: orderDetails.length, totalCost },
    });
  } catch (err) {
    next(err);
  }
};

