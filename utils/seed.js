require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Alert = require('../models/Alert');
const Activity = require('../models/Activity');
const Communication = require('../models/Communication');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    Medicine.deleteMany(),
    Supplier.deleteMany(),
    Alert.deleteMany(),
    Activity.deleteMany(),
    Communication.deleteMany(),
  ]);
  console.log('Cleared existing data');

  // Create default user
  const user = await User.create({
    name: 'Dr. Sarah Johnson',
    email: 'admin@pharmacare.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '+1 (555) 987-6543',
  });
  console.log(`Created user: ${user.email} / password: Admin@123`);

  // Create suppliers
  const suppliers = await Supplier.insertMany([
    {
      name: 'MedSupply Co.',
      contact: 'John Anderson',
      email: 'john@medsupply.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      activeOrders: 5,
      totalOrders: 142,
      rating: 4.8,
      responseTime: '2 hours',
      reliability: 98,
    },
    {
      name: 'PharmaDirect',
      contact: 'Sarah Mitchell',
      email: 'sarah@pharmadirect.com',
      phone: '+1 (555) 234-5678',
      location: 'Los Angeles, CA',
      activeOrders: 3,
      totalOrders: 98,
      rating: 4.6,
      responseTime: '4 hours',
      reliability: 95,
    },
    {
      name: 'HealthPlus Distributors',
      contact: 'Michael Chen',
      email: 'michael@healthplus.com',
      phone: '+1 (555) 345-6789',
      location: 'Chicago, IL',
      activeOrders: 2,
      totalOrders: 76,
      rating: 4.9,
      responseTime: '1 hour',
      reliability: 99,
    },
  ]);
  console.log(`Created ${suppliers.length} suppliers`);

  // Create medicines (with status auto-computed by pre-save hook)
  const futureDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  const medicines = await Promise.all([
    Medicine.create({
      name: 'Paracetamol 500mg', category: 'Pain Relief', stock: 450, minStock: 200,
      expiry: futureDate(180), supplier: 'MedSupply Co.', consumption: '12/day', consumptionRate: 12,
      batchNumber: 'BN-001', unitPrice: 0.10,
    }),
    Medicine.create({
      name: 'Ibuprofen 400mg', category: 'Anti-inflammatory', stock: 95, minStock: 150,
      expiry: futureDate(120), supplier: 'PharmaDirect', consumption: '8/day', consumptionRate: 8,
      batchNumber: 'BN-002', unitPrice: 0.25,
    }),
    Medicine.create({
      name: 'Aspirin 75mg', category: 'Cardiovascular', stock: 45, minStock: 100,
      expiry: futureDate(20), supplier: 'HealthPlus Distributors', consumption: '15/day', consumptionRate: 15,
      batchNumber: 'BN-003', unitPrice: 0.08,
    }),
    Medicine.create({
      name: 'Amoxicillin 500mg', category: 'Antibiotic', stock: 280, minStock: 150,
      expiry: futureDate(12), supplier: 'MedSupply Co.', consumption: '6/day', consumptionRate: 6,
      batchNumber: 'BN-004', unitPrice: 0.45,
    }),
    Medicine.create({
      name: 'Metformin 850mg', category: 'Diabetes', stock: 620, minStock: 300,
      expiry: futureDate(300), supplier: 'PharmaDirect', consumption: '10/day', consumptionRate: 10,
      batchNumber: 'BN-005', unitPrice: 0.30,
    }),
    Medicine.create({
      name: 'Lisinopril 10mg', category: 'Cardiovascular', stock: 310, minStock: 200,
      expiry: futureDate(200), supplier: 'HealthPlus Distributors', consumption: '9/day', consumptionRate: 9,
      batchNumber: 'BN-006', unitPrice: 0.50,
    }),
    Medicine.create({
      name: 'Atorvastatin 20mg', category: 'Cardiovascular', stock: 180, minStock: 150,
      expiry: futureDate(250), supplier: 'MedSupply Co.', consumption: '7/day', consumptionRate: 7,
      batchNumber: 'BN-007', unitPrice: 0.80,
    }),
  ]);
  console.log(`Created ${medicines.length} medicines`);

  // Create alerts
  await Alert.insertMany([
    {
      type: 'critical', category: 'Low Stock',
      title: 'Critical Stock Level - Aspirin 75mg',
      message: 'Only 45 units remaining. Minimum threshold is 100 units. Immediate reorder recommended.',
      medicine: 'Aspirin 75mg', currentStock: 45, minStock: 100,
    },
    {
      type: 'critical', category: 'Expiring Soon',
      title: 'Medicine Expiring - Amoxicillin 500mg',
      message: 'Will expire in 12 days. 280 units in stock. Consider promotional pricing or return to supplier.',
      medicine: 'Amoxicillin 500mg', expiryDate: futureDate(12), daysLeft: 12,
    },
    {
      type: 'warning', category: 'Low Stock',
      title: 'Low Stock Warning - Ibuprofen 400mg',
      message: 'Stock level at 95 units, below minimum of 150. Auto-reorder can be triggered.',
      medicine: 'Ibuprofen 400mg', currentStock: 95, minStock: 150,
    },
    {
      type: 'info', category: 'Auto-Reorder',
      title: 'Auto-Reorder Triggered - Paracetamol 500mg',
      message: 'Automatic reorder placed for 1000 units. Order ID: ORD-2847. Supplier: MedSupply Co.',
      medicine: 'Paracetamol 500mg', orderQty: 1000, orderId: 'ORD-2847', supplier: 'MedSupply Co.',
    },
    {
      type: 'success', category: 'Supplier Response',
      title: 'Order Confirmed - Order #ORD-2845',
      message: 'PharmaDirect confirmed order. Expected delivery: 3-5 business days.',
      orderId: 'ORD-2845', supplier: 'PharmaDirect',
    },
  ]);
  console.log('Created alerts');

  // Create recent activity
  await Activity.insertMany([
    { action: 'Added', entity: 'Medicine', entityName: 'Paracetamol 500mg', performedBy: user._id, meta: { stock: 450 } },
    { action: 'Updated', entity: 'Medicine', entityName: 'Ibuprofen 400mg', performedBy: user._id },
    { action: 'Reordered', entity: 'Medicine', entityName: 'Aspirin 75mg', performedBy: user._id, meta: { orderId: 'ORD-2847', orderQty: 500 } },
    { action: 'Added', entity: 'Supplier', entityName: 'HealthPlus Distributors', performedBy: user._id },
    { action: 'Logged In', entity: 'User', entityName: user.name, performedBy: user._id },
  ]);
  console.log('Created activities');

  // Create communications
  await Communication.insertMany([
    { supplier: 'MedSupply Co.', message: 'Order #ORD-2847 confirmed. Expected delivery: Feb 25, 2025', type: 'success' },
    { supplier: 'PharmaDirect', message: 'Price update notification for Ibuprofen 400mg', type: 'info' },
    { supplier: 'HealthPlus Distributors', message: 'Shipment delayed by 1 day due to weather conditions', type: 'warning' },
  ]);
  console.log('Created communications');

  console.log('\n✅ Seed completed successfully!');
  console.log('Login credentials: admin@pharmacare.com / Admin@123');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

