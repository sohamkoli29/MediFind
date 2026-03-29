import mongoose from 'mongoose';

const pharmacySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Pharmacy name is required'],
      trim: true,
    },
    licenceNumber: {
      type: String,
      required: [true, 'Licence number is required'],
      unique: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    operatingHours: {
      open: { type: String, default: '09:00' },
      close: { type: String, default: '21:00' },
      closedOn: [{ type: String }],
    },
    profileImage: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

pharmacySchema.index({ location: '2dsphere' });

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);
export default Pharmacy;