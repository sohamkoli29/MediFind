import Inventory from '../models/Inventory.js';
import Pharmacy from '../models/Pharmacy.js';
import { io } from '../server.js';

const getPharmacy = async (userId) => {
  const pharmacy = await Pharmacy.findOne({ owner: userId });
  if (!pharmacy) throw new Error('No pharmacy found for this account');
  return pharmacy;
};

export const addToInventory = async (req, res) => {
  try {
    const pharmacy = await getPharmacy(req.user._id);
    const { medicineName, brandNames, saltComposition, category, quantity, price, unit, lowStockThreshold } = req.body;

    // Check duplicate medicine name in same pharmacy
    const existing = await Inventory.findOne({
      pharmacy: pharmacy._id,
      medicineName: { $regex: new RegExp(`^${medicineName}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({ message: 'Medicine already in inventory. Use update instead.' });
    }

    const item = await Inventory.create({
      pharmacy: pharmacy._id,
      medicineName,
      brandNames,
      saltComposition,
      category,
      quantity,
      price,
      unit,
      lowStockThreshold,
    });

    io.emit('stock_updated', {
      pharmacyId: pharmacy._id,
      medicineName,
      quantity,
      inStock: item.inStock,
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInventoryItem = async (req, res) => {
  try {
    const pharmacy = await getPharmacy(req.user._id);
    const { quantity, price, unit, lowStockThreshold, brandNames, saltComposition } = req.body;

    const item = await Inventory.findOne({
      _id: req.params.id,
      pharmacy: pharmacy._id,
    });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (quantity !== undefined) item.quantity = quantity;
    if (price !== undefined) item.price = price;
    if (unit !== undefined) item.unit = unit;
    if (lowStockThreshold !== undefined) item.lowStockThreshold = lowStockThreshold;
    if (brandNames !== undefined) item.brandNames = brandNames;
    if (saltComposition !== undefined) item.saltComposition = saltComposition;

    await item.save();

    io.emit('stock_updated', {
      pharmacyId: pharmacy._id,
      medicineName: item.medicineName,
      quantity: item.quantity,
      inStock: item.inStock,
    });

    res.status(200).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    const pharmacy = await getPharmacy(req.user._id);

    const item = await Inventory.findOneAndDelete({
      _id: req.params.id,
      pharmacy: pharmacy._id,
    });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    io.emit('stock_updated', {
      pharmacyId: pharmacy._id,
      medicineName: item.medicineName,
      quantity: 0,
      inStock: false,
    });

    res.status(200).json({ success: true, message: 'Item removed from inventory' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyInventory = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
    if (!pharmacy) {
      return res.status(404).json({ message: 'No pharmacy found for this account' });
    }

    const inventory = await Inventory.find({ pharmacy: pharmacy._id })
      .sort({ medicineName: 1 });

    res.status(200).json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};