import Pharmacy from '../models/Pharmacy.js';
import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import Medicine from '../models/Medicine.js';

// ─── Get Verification Queue ────────────────────────────────────────────────────
// GET /api/admin/pharmacies/pending
export const getPendingPharmacies = async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({ verificationStatus: 'pending' })
      .populate('owner', 'name email phone')
      .sort({ createdAt: 1 });     // oldest first

    res.status(200).json({ success: true, pharmacies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Verify or Reject Pharmacy ─────────────────────────────────────────────────
// PATCH /api/admin/pharmacies/:id/verify
export const verifyPharmacy = async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be verified or rejected' });
    }

    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status },
      { new: true }
    ).populate('owner', 'name email');

    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    res.status(200).json({ success: true, pharmacy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get All Users ─────────────────────────────────────────────────────────────
// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Toggle User Active Status ─────────────────────────────────────────────────
// PATCH /api/admin/users/:id/toggle
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot suspend admin accounts' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'suspended'}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Analytics ─────────────────────────────────────────────────────────────────
// GET /api/admin/analytics
export const getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers, totalPharmacies, verifiedPharmacies,
      pendingPharmacies, totalMedicines, totalInventoryItems,
    ] = await Promise.all([
      User.countDocuments(),
      Pharmacy.countDocuments(),
      Pharmacy.countDocuments({ verificationStatus: 'verified' }),
      Pharmacy.countDocuments({ verificationStatus: 'pending' }),
      Medicine.countDocuments(),
      Inventory.countDocuments({ inStock: true }),
    ]);

    // Top 10 most stocked medicines across all pharmacies
    const topMedicines = await Inventory.aggregate([
      { $match: { inStock: true } },
      { $group: { _id: '$medicine', pharmacyCount: { $sum: 1 }, totalQuantity: { $sum: '$quantity' } } },
      { $sort: { pharmacyCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'medicines', localField: '_id', foreignField: '_id', as: 'medicine' } },
      { $unwind: '$medicine' },
      { $project: { 'medicine.genericName': 1, 'medicine.category': 1, pharmacyCount: 1, totalQuantity: 1 } },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalUsers,
        totalPharmacies,
        verifiedPharmacies,
        pendingPharmacies,
        totalMedicines,
        totalInventoryItems,
        topMedicines,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};