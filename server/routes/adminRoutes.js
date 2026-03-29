import express from 'express';
import {
  getPendingPharmacies, verifyPharmacy,
  getAllUsers, toggleUserStatus, getAnalytics,
} from '../controllers/adminController.js';
import protect from '../middleware/authMiddleware.js';
import authorise from '../middleware/roleMiddleware.js';

const router = express.Router();

// All admin routes — double guarded
router.use(protect, authorise('admin'));

router.get('/pharmacies/pending', getPendingPharmacies);
router.patch('/pharmacies/:id/verify', verifyPharmacy);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/analytics', getAnalytics);

export default router;