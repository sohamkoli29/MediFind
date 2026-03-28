import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
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
      default: 10,             // alert pharmacy when quantity drops below this
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index — one medicine per pharmacy only
inventorySchema.index({ pharmacy: 1, medicine: 1 }, { unique: true });

// Auto-set inStock based on quantity before every save
inventorySchema.pre('save', function (next) {
  this.inStock = this.quantity > 0;
  this.lastUpdated = Date.now();
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);
export default Inventory;