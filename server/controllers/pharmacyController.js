import Pharmacy from '../models/Pharmacy.js';
import Inventory from '../models/Inventory.js';

export const registerPharmacy = async (req, res) => {
  try {
    const { name, licenceNumber, address, phone, coordinates, operatingHours } = req.body;

    const existing = await Pharmacy.findOne({ owner: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already registered a pharmacy' });
    }

    const licenceTaken = await Pharmacy.findOne({ licenceNumber });
    if (licenceTaken) {
      return res.status(400).json({ message: 'Licence number already registered' });
    }

    const pharmacy = await Pharmacy.create({
      owner: req.user._id,
      name,
      licenceNumber,
      address,
      phone,
      operatingHours,
      location: {
        type: 'Point',
        coordinates,
      },
    });

    res.status(201).json({ success: true, pharmacy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyPharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
    if (!pharmacy) {
      return res.status(404).json({ message: 'No pharmacy found for this account' });
    }
    res.status(200).json({ success: true, pharmacy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPharmacyInventory = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    const inventory = await Inventory.find({ pharmacy: req.params.id })
      .sort({ medicineName: 1 });

    res.status(200).json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Core geospatial search — now searches inventory text index directly
export const getNearbyPharmacies = async (req, res) => {
  try {
    const { q, lng, lat, radius = 5 } = req.query;

    if (!q || !lng || !lat) {
      return res.status(400).json({ message: 'q, lng, and lat are required' });
    }

    const radiusInMeters = parseFloat(radius) * 1000;

    // Step 1: find verified pharmacies within radius
    const nearbyPharmacies = await Pharmacy.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radiusInMeters,
        },
      },
    }).select('name address phone operatingHours location');

    if (nearbyPharmacies.length === 0) {
      return res.status(200).json({ success: true, results: [] });
    }

    // Step 2: search inventory by medicine name within those pharmacies
    const pharmacyIds = nearbyPharmacies.map((p) => p._id);

    const inventoryRecords = await Inventory.find({
      pharmacy: { $in: pharmacyIds },
      inStock: true,
      quantity: { $gt: 0 },
      $text: { $search: q },
    }).select('pharmacy medicineName brandNames saltComposition quantity price unit lastUpdated');

    // Step 3: group inventory by pharmacy
    const inventoryMap = {};
    inventoryRecords.forEach((inv) => {
      const pid = inv.pharmacy.toString();
      if (!inventoryMap[pid]) inventoryMap[pid] = [];
      inventoryMap[pid].push(inv);
    });

    // Step 4: merge and return only pharmacies that have matching stock
    const results = nearbyPharmacies
      .filter((p) => inventoryMap[p._id.toString()])
      .map((p) => ({
        pharmacy: p,
        medicines: inventoryMap[p._id.toString()],
      }));

    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMyPharmacy = async (req, res) => {
  try {
    const allowedUpdates = ['phone', 'operatingHours', 'address', 'profileImage'];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const pharmacy = await Pharmacy.findOneAndUpdate(
      { owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    res.status(200).json({ success: true, pharmacy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};