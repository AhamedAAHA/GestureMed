import mongoose from 'mongoose';

const emergencyTemplateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    label: {
      en: { type: String, required: true },
      ta: { type: String },
      si: { type: String },
    },
    message: {
      en: { type: String, required: true },
      ta: { type: String },
      si: { type: String },
    },
    defaultUrgency: { type: String, enum: ['Normal', 'Warning', 'Emergency'], default: 'Warning' },
    icon: { type: String, default: 'alert' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('EmergencyTemplate', emergencyTemplateSchema);
