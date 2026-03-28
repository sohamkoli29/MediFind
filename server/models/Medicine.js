import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    genericName: {
      type: String,
      required: [true, 'Generic name is required'],
      trim: true,
    },
    brandNames: [{ type: String, trim: true }],   // e.g. ['Crocin', 'Calpol']
    saltComposition: {
      type: String,
      trim: true,                                  // e.g. 'Paracetamol 500mg'
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
    aliases: [{ type: String, trim: true }],       // for alias matching in search
    requiresPrescription: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',                                 // admin who added to master list
    },
  },
  { timestamps: true }
);

// Text index for full-text search across name, brands, salt, aliases
medicineSchema.index({
  genericName: 'text',
  brandNames: 'text',
  saltComposition: 'text',
  aliases: 'text',
});

const Medicine = mongoose.model('Medicine', medicineSchema);
export default Medicine;