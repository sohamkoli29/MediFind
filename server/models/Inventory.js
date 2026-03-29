import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    brandNames: [{ type: String, trim: true }],
    saltComposition: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'antibiotic', 'analgesic', 'antiviral',
        'antifungal', 'cardiovascular', 'diabetes',
        'respiratory', 'vitamin', 'other'
      ],
      default: 'other',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price: {
      type: Number,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['strip', 'bottle', 'vial', 'sachet', 'tube', 'other'],
      default: 'strip',
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Text index for patient search
inventorySchema.index({
  medicineName: 'text',
  brandNames: 'text',
  saltComposition: 'text',
});

// Auto-set inStock from quantity
inventorySchema.pre('save', function () {
  this.inStock = this.quantity > 0;
  this.lastUpdated = Date.now();
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;