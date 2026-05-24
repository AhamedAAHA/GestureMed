import mongoose from 'mongoose';

const wardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    floor: { type: String, trim: true },
    capacity: { type: Number, min: 0, default: 0 },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Ward', wardSchema);
