import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['patient', 'doctor', 'nurse', 'admin'], required: true },
    name: { type: String, required: true, trim: true },
    preferredLanguage: { type: String, enum: ['en', 'ta', 'si'], default: 'en' },
    isActive: { type: Boolean, default: true },
    profileRef: { type: mongoose.Schema.Types.ObjectId },
    profileModel: { type: String, enum: ['Patient', 'Doctor', null], default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
