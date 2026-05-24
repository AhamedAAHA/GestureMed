import mongoose from 'mongoose';

const communicationRequestSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rawMessage: { type: String, required: true },
    improvedMessage: { type: String },
    translatedMessage: { type: String },
    language: { type: String, enum: ['en', 'ta', 'si'], default: 'en' },
    source: { type: String, enum: ['sign', 'text', 'template', 'emergency'], default: 'text' },
    detectedSigns: [{ type: String }],
    urgency: { type: String, enum: ['Normal', 'Warning', 'Emergency'], default: 'Normal' },
    urgencyScore: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'handled', 'cancelled'], default: 'pending' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    handledAt: { type: Date },
    voiceUrl: { type: String },
    voiceBase64: { type: String },
    isPinned: { type: Boolean, default: false },
    triageNotes: { type: String },
  },
  { timestamps: true }
);

communicationRequestSchema.index({ urgency: 1, status: 1, createdAt: -1 });

export default mongoose.model('CommunicationRequest', communicationRequestSchema);
