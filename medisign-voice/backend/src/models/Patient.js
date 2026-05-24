import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 0, max: 150 },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
    bloodGroup: { type: String, trim: true },
    allergies: [{ type: String, trim: true }],
    medicalCondition: { type: String, trim: true },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
    roomNumber: { type: String, trim: true },
    preferredLanguage: { type: String, enum: ['en', 'ta', 'si'], default: 'en' },
  },
  { timestamps: true }
);

export default mongoose.model('Patient', patientSchema);
