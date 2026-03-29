import Inventory from '../models/Inventory.js';
import Pharmacy from '../models/Pharmacy.js';
import { io } from '../server.js';
import multer from 'multer';
import { parseInventoryCSV } from '../utils/csvParser.js';

const getPharmacy = async (userId) => {
  const pharmacy = await Pharmacy.findOne({ owner: userId });
  if (!pharmacy) throw new Error('No pharmacy found for this account');
  return pharmacy;
};
// Multer — memory storage (no disk write needed)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});
// POST /api/inventory/bulk
export const bulkUploadInventory = async (req, res) => {
  try {
    const pharmacy = await getPharmacy(req.user._id);

    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const csvString = req.file.buffer.toString('utf-8');
    const { rows, rowErrors } = parseInventoryCSV(csvString);

    if (rows.length === 0) {
      return res.status(400).json({
        message: 'No valid rows found in CSV',
        errors: rowErrors,
      });
    }

    const results = { added: 0, updated: 0, skipped: 0, errors: [...rowErrors] };

    for (const row of rows) {
      try {
        const existing = await Inventory.findOne({
          pharmacy: pharmacy._id,
          medicineName: { $regex: new RegExp(`^${row.medicineName}$`, 'i') },
        });

        if (existing) {
          // Update quantity + price if already exists
          existing.quantity = row.quantity;
          if (row.price !== undefined) existing.price = row.price;
          await existing.save();
          results.updated++;
        } else {
          await Inventory.create({ pharmacy: pharmacy._id, ...row });
          results.added++;
        }
      } catch (err) {
        results.errors.push(`${row.medicineName}: ${err.message}`);
        results.skipped++;
      }
    }

    // Emit socket event for bulk update
    io.emit('stock_updated', {
      pharmacyId: pharmacy._id,
      medicineName: 'bulk update',
      quantity: results.added + results.updated,
      inStock: true,
    });

    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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