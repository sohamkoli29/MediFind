import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    radius: {
      type: Number,
      default: 5,              // km — notify when stock found within this radius
      min: 1,
      max: 25,
    },
    userLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number],   // [longitude, latitude]
    },
    notifiedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,           // false once notification is sent
    },
  },
  { timestamps: true }
);

alertSchema.index({ userLocation: '2dsphere' });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;