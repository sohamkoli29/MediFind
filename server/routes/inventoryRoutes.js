import express from 'express';
import {
  addToInventory, updateInventoryItem,
  deleteInventoryItem, getMyInventory,
} from '../controllers/inventoryController.js';
import protect from '../middleware/authMiddleware.js';
import authorise from '../middleware/roleMiddleware.js';

const router = express.Router();

// All inventory routes require pharmacy_staff
router.use(protect, authorise('pharmacy_staff'));

router.get('/me', getMyInventory);
router.post('/', addToInventory);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;