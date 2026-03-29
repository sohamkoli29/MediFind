import express from 'express';
import {
  registerPharmacy, getMyPharmacy, getPharmacyInventory,
  getNearbyPharmacies, updateMyPharmacy,
} from '../controllers/pharmacyController.js';
import protect from '../middleware/authMiddleware.js';
import authorise from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public
router.get('/nearby', getNearbyPharmacies);
router.get('/:id/inventory', getPharmacyInventory);

// Pharmacy staff only
router.post('/register', protect, authorise('pharmacy_staff'), registerPharmacy);
router.get('/me', protect, authorise('pharmacy_staff'), getMyPharmacy);
router.put('/me', protect, authorise('pharmacy_staff'), updateMyPharmacy);

export default router;