import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    specialization: { type: String, trim: true },
    department: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    wardIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ward' }],
    isOnDuty: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Doctor', doctorSchema);
