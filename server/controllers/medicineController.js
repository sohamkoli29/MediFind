import Medicine from '../models/Medicine.js';

// ─── Create Medicine (Admin only) ─────────────────────────────────────────────
// POST /api/medicines
export const createMedicine = async (req, res) => {
  try {
    const { genericName, brandNames, saltComposition, category, aliases, requiresPrescription, description } = req.body;

    const existing = await Medicine.findOne({
      genericName: { $regex: new RegExp(`^${genericName}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ message: 'Medicine already exists in master list' });
    }

    const medicine = await Medicine.create({
      genericName,
      brandNames,
      saltComposition,
      category,
      aliases,
      requiresPrescription,
      description,
      addedBy: req.user._id,
    });

    res.status(201).json({ success: true, medicine });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Search Medicines (Public) ────────────────────────────────────────────────
// GET /api/medicines/search?q=paracetamol
export const searchMedicines = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    // Full-text search using the text index on Medicine model
    const medicines = await Medicine.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }        // include relevance score
    )
      .sort({ score: { $meta: 'textScore' } }) // sort by relevance
      .limit(20);

    // Fallback: regex search if text index returns nothing
    if (medicines.length === 0) {
      const regex = new RegExp(q, 'i');
      const fallback = await Medicine.find({
        $or: [
          { genericName: regex },
          { brandNames: regex },
          { saltComposition: regex },
          { aliases: regex },
        ],
      }).limit(20);

      return res.status(200).json({ success: true, medicines: fallback });
    }

    res.status(200).json({ success: true, medicines });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get All Medicines (Admin) ────────────────────────────────────────────────
// GET /api/medicines
export const getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ genericName: 1 });
    res.status(200).json({ success: true, medicines });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Single Medicine ──────────────────────────────────────────────────────
// GET /api/medicines/:id
export const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.status(200).json({ success: true, medicine });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Medicine (Admin only) ─────────────────────────────────────────────
// PUT /api/medicines/:id
export const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.status(200).json({ success: true, medicine });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Medicine (Admin only) ─────────────────────────────────────────────
// DELETE /api/medicines/:id
export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.status(200).json({ success: true, message: 'Medicine removed from master list' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};