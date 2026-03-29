import express from 'express';
import {
  createMedicine, searchMedicines, getAllMedicines,
  getMedicineById, updateMedicine, deleteMedicine,
} from '../controllers/medicineController.js';
import protect from '../middleware/authMiddleware.js';
import authorise from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public
router.get('/search', searchMedicines);
router.get('/:id', getMedicineById);

// Admin only
router.get('/', protect, authorise('admin'), getAllMedicines);
router.post('/', protect, authorise('admin'), createMedicine);
router.put('/:id', protect, authorise('admin'), updateMedicine);
router.delete('/:id', protect, authorise('admin'), deleteMedicine);

export default router;