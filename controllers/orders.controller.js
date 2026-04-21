const Order = require('../models/Order');
const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');
const Activity = require('../models/Activity');

// @desc  Get all orders
// @route GET /api/orders
exports.getOrders = async (req, res, next) => {
  try {
    const { status, supplierId } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (supplierId) {
      filter.supplier = supplierId;
    }

    const orders = await Order.find(filter)
      .populate('supplier', 'name email phone')
      .populate('items.medicine', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single order
// @route GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('supplier', 'name email phone location')
      .populate('items.medicine', 'name category')
      .populate('placedBy', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @desc  Create order
// @route POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { supplierId, items, notes, expectedDelivery } = req.body;

    // Validate supplier
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Validate and enrich items
    const enrichedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine not found: ${item.medicineId}`
        });
      }

      const itemTotal = item.quantity * item.unitPrice;
      enrichedItems.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal
      });
      totalAmount += itemTotal;
    }

    // Create order
    const order = await Order.create({
      supplier: supplierId,
      supplierName: supplier.name,
      items: enrichedItems,
      totalAmount,
      notes,
      expectedDelivery,
      placedBy: req.user._id
    });

    // Update supplier stats
    await Supplier.findByIdAndUpdate(supplierId, {
      $inc: { activeOrders: 1, totalOrders: 1 }
    });

    // Log activity
    await Activity.create({
      action: 'Created',
      entity: 'Order',
      entityId: order._id.toString(),
      entityName: order.orderNumber,
      performedBy: req.user._id,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('supplier', 'name email phone')
      .populate('items.medicine', 'name');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: populatedOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Update order status
// @route PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, actualDelivery } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;

    if (actualDelivery) {
      order.actualDelivery = actualDelivery;
    }

    // If order is delivered or cancelled, decrement active orders
    if ((status === 'delivered' || status === 'cancelled') &&
        oldStatus !== 'delivered' && oldStatus !== 'cancelled') {
      await Supplier.findByIdAndUpdate(order.supplier, {
        $inc: { activeOrders: -1 }
      });

      // If delivered, update medicine stock
      if (status === 'delivered') {
        for (const item of order.items) {
          await Medicine.findByIdAndUpdate(item.medicine, {
            $inc: { stock: item.quantity }
          });
        }
      }
    }

    await order.save();

    await Activity.create({
      action: 'Updated',
      entity: 'Order',
      entityId: order._id.toString(),
      entityName: `${order.orderNumber} - Status: ${status}`,
      performedBy: req.user._id,
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('supplier', 'name email phone')
      .populate('items.medicine', 'name');

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: populatedOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Cancel order
// @route DELETE /api/orders/:id
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a delivered order'
      });
    }

    // Update status to cancelled instead of deleting
    order.status = 'cancelled';
    await order.save();

    // Decrement active orders if it was active
    if (['pending', 'confirmed', 'shipped'].includes(order.status)) {
      await Supplier.findByIdAndUpdate(order.supplier, {
        $inc: { activeOrders: -1 }
      });
    }

    await Activity.create({
      action: 'Cancelled',
      entity: 'Order',
      entityId: order._id.toString(),
      entityName: order.orderNumber,
      performedBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (err) {
    next(err);
  }
};

