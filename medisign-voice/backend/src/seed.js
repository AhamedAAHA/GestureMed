import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Patient from './models/Patient.js';
import Doctor from './models/Doctor.js';
import Ward from './models/Ward.js';
import EmergencyTemplate from './models/EmergencyTemplate.js';
import CommunicationRequest from './models/CommunicationRequest.js';
import MedicalNote from './models/MedicalNote.js';
import AuditLog from './models/AuditLog.js';

async function clearData() {
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Ward.deleteMany({}),
    EmergencyTemplate.deleteMany({}),
    CommunicationRequest.deleteMany({}),
    MedicalNote.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
}

async function seed() {
  await connectDB();
  await clearData();
  console.log('Cleared existing data');

  const wards = await Ward.insertMany([
    { name: 'Emergency Ward', floor: 'Ground', capacity: 20, description: 'Critical care' },
    { name: 'Cardiology', floor: '2nd', capacity: 15, description: 'Heart patients' },
    { name: 'General Ward A', floor: '3rd', capacity: 30, description: 'General admissions' },
  ]);

  const templates = await EmergencyTemplate.insertMany([
    {
      key: 'chest_pain',
      label: { en: 'Chest pain', ta: 'மார்பு வலி', si: 'උරහිස් වේදනාව' },
      message: {
        en: 'I have severe chest pain. Please help immediately.',
        ta: 'எனக்கு கடுமையான மார்பு வலி. உடனடியாக உதவுங்கள்.',
        si: 'මට දැඩි උරහිස් වේදනාවක් තිබේ. කරුණාකර වහාම උදව් කරන්න.',
      },
      defaultUrgency: 'Emergency',
      icon: 'heart',
    },
    {
      key: 'breathing',
      label: { en: 'Breathing difficulty', ta: 'சுவாச பிரச்சனை', si: 'ශ්වසන දුෂ්කරතාව' },
      message: {
        en: 'I am having difficulty breathing. Please assist urgently.',
        ta: 'எனக்கு சுவாசிப்பதில் சிரமம். உடனடியாக உதவுங்கள்.',
        si: 'මට හුස්ම ගැනීමට අපහසුයි. කරුණාකර වහාම උදව් කරන්න.',
      },
      defaultUrgency: 'Emergency',
      icon: 'lungs',
    },
    {
      key: 'bleeding',
      label: { en: 'Bleeding', ta: 'இரத்தம்', si: 'රුධිරය' },
      message: {
        en: 'I have heavy bleeding. Please send help immediately.',
        ta: 'எனக்கு அதிக இரத்தம் வடியുന്നു. உடனே உதவி அனுப்புங்கள்.',
        si: 'මට රුධිරය බොහෝ ලෙස ගලයි. කරුණාකර වහාම උදව් කරන්න.',
      },
      defaultUrgency: 'Emergency',
      icon: 'blood',
    },
    {
      key: 'water',
      label: { en: 'Need water', ta: 'தண்ணீர் வேண்டும்', si: 'ජලය අවශ්‍යයි' },
      message: {
        en: 'I need water please.',
        ta: 'எனக்கு தண்ணீர் வேண்டும்.',
        si: 'මට ජලය අවශ්‍යයි.',
      },
      defaultUrgency: 'Normal',
      icon: 'water',
    },
    {
      key: 'doctor',
      label: { en: 'Need doctor', ta: 'மருத்துவர் வேண்டும்', si: 'වෛද්‍යවරයා අවශ්‍යයි' },
      message: {
        en: 'I need to see a doctor urgently.',
        ta: 'எனக்கு மருத்துவரை பார்க்க வேண்டும்.',
        si: 'මට වෛද්‍යවරයෙකු අවශ්‍යයි.',
      },
      defaultUrgency: 'Warning',
      icon: 'doctor',
    },
    {
      key: 'family',
      label: { en: 'Call family', ta: 'குடும்பத்தை அழைக்கவும்', si: 'පවුල අමතන්න' },
      message: {
        en: 'Please call my family.',
        ta: 'தயவுசெய்து என் குடும்பத்தை அழைக்கவும்.',
        si: 'කරුණාකර මගේ පවුල අමතන්න.',
      },
      defaultUrgency: 'Normal',
      icon: 'phone',
    },
    {
      key: 'pain',
      label: { en: 'Pain', ta: 'வலி', si: 'වේදනාව' },
      message: {
        en: 'I am in pain and need assistance.',
        ta: 'எனக்கு வலி உள்ளது, உதவி வேண்டும்.',
        si: 'මට වේදනාවක් තිබේ, උදව් අවශ්‍යයි.',
      },
      defaultUrgency: 'Warning',
      icon: 'pain',
    },
    {
      key: 'help',
      label: { en: 'Help', ta: 'உதவி', si: 'උදව්' },
      message: {
        en: 'Please help me.',
        ta: 'தயவுசெய்து எனக்கு உதவுங்கள்.',
        si: 'කරුණාකර මට උදව් කරන්න.',
      },
      defaultUrgency: 'Warning',
      icon: 'help',
    },
  ]);

  const adminUser = await User.create({
    email: 'admin@gesture.com',
    password: 'admin123',
    name: 'System Admin',
    role: 'admin',
    preferredLanguage: 'en',
  });

  const patientUsers = await Promise.all([
    User.create({
      email: 'arun@patient.com',
      password: 'patient123',
      name: 'Arun Kumar',
      role: 'patient',
      preferredLanguage: 'ta',
    }),
    User.create({
      email: 'sita@patient.com',
      password: 'patient123',
      name: 'Sita Perera',
      role: 'patient',
      preferredLanguage: 'si',
    }),
    User.create({
      email: 'john@patient.com',
      password: 'patient123',
      name: 'John Smith',
      role: 'patient',
      preferredLanguage: 'en',
    }),
  ]);

  const patients = await Patient.insertMany([
    {
      userId: patientUsers[0]._id,
      name: 'Arun Kumar',
      age: 45,
      gender: 'male',
      bloodGroup: 'B+',
      allergies: ['Penicillin'],
      medicalCondition: 'Hypertension',
      emergencyContact: { name: 'Priya Kumar', phone: '+94771234567', relation: 'Wife' },
      wardId: wards[1]._id,
      roomNumber: '201',
      preferredLanguage: 'ta',
    },
    {
      userId: patientUsers[1]._id,
      name: 'Sita Perera',
      age: 32,
      gender: 'female',
      bloodGroup: 'O+',
      allergies: [],
      medicalCondition: 'Asthma',
      emergencyContact: { name: 'Nimal Perera', phone: '+94777654321', relation: 'Brother' },
      wardId: wards[0]._id,
      roomNumber: 'E-12',
      preferredLanguage: 'si',
    },
    {
      userId: patientUsers[2]._id,
      name: 'John Smith',
      age: 58,
      gender: 'male',
      bloodGroup: 'A-',
      allergies: ['Latex'],
      medicalCondition: 'Diabetes Type 2',
      emergencyContact: { name: 'Mary Smith', phone: '+447700900123', relation: 'Spouse' },
      wardId: wards[2]._id,
      roomNumber: '305',
      preferredLanguage: 'en',
    },
  ]);

  for (let i = 0; i < patientUsers.length; i++) {
    patientUsers[i].profileRef = patients[i]._id;
    patientUsers[i].profileModel = 'Patient';
    await patientUsers[i].save();
  }

  const doctorUsers = await Promise.all([
    User.create({
      email: 'dr.lee@medisign.com',
      password: 'doctor123',
      name: 'Dr. Sarah Lee',
      role: 'doctor',
      preferredLanguage: 'en',
    }),
    User.create({
      email: 'dr.raj@medisign.com',
      password: 'doctor123',
      name: 'Dr. Raj Patel',
      role: 'doctor',
      preferredLanguage: 'en',
    }),
  ]);

  const doctors = await Doctor.insertMany([
    {
      userId: doctorUsers[0]._id,
      name: 'Dr. Sarah Lee',
      specialization: 'Emergency Medicine',
      department: 'ER',
      licenseNumber: 'MD-ER-001',
      wardIds: [wards[0]._id, wards[1]._id],
      isOnDuty: true,
    },
    {
      userId: doctorUsers[1]._id,
      name: 'Dr. Raj Patel',
      specialization: 'Cardiology',
      department: 'Cardiology',
      licenseNumber: 'MD-CARD-002',
      wardIds: [wards[1]._id, wards[2]._id],
      isOnDuty: true,
    },
  ]);

  for (let i = 0; i < doctorUsers.length; i++) {
    doctorUsers[i].profileRef = doctors[i]._id;
    doctorUsers[i].profileModel = 'Doctor';
    await doctorUsers[i].save();
  }

  const requests = await CommunicationRequest.insertMany([
    {
      patientId: patients[0]._id,
      createdBy: patientUsers[0]._id,
      rawMessage: 'pain chest breathing hard',
      improvedMessage:
        'I have chest pain and difficulty breathing. Please help me immediately.',
      translatedMessage:
        'எனக்கு மார்பு வலி மற்றும் சுவாசிப்பதில் சிரமம். உடனடியாக உதவுங்கள்.',
      language: 'ta',
      source: 'sign',
      detectedSigns: ['pain', 'chest', 'breathing'],
      urgency: 'Emergency',
      urgencyScore: 85,
      status: 'pending',
      isPinned: true,
      triageNotes: 'Critical symptoms detected',
    },
    {
      patientId: patients[1]._id,
      createdBy: patientUsers[1]._id,
      rawMessage: 'need water',
      improvedMessage: 'I need water please.',
      language: 'si',
      source: 'template',
      urgency: 'Normal',
      urgencyScore: 5,
      status: 'pending',
    },
    {
      patientId: patients[2]._id,
      createdBy: patientUsers[2]._id,
      rawMessage: 'feeling dizzy and weak',
      improvedMessage: 'I am feeling dizzy and weak. Please check on me.',
      language: 'en',
      source: 'text',
      urgency: 'Warning',
      urgencyScore: 30,
      status: 'pending',
    },
    {
      patientId: patients[0]._id,
      createdBy: patientUsers[0]._id,
      rawMessage: 'call family',
      improvedMessage: 'Please call my family.',
      language: 'ta',
      source: 'template',
      urgency: 'Normal',
      urgencyScore: 0,
      status: 'handled',
      handledBy: doctorUsers[0]._id,
      handledAt: new Date(),
    },
    {
      patientId: patients[1]._id,
      createdBy: patientUsers[1]._id,
      rawMessage: 'heavy bleeding',
      improvedMessage: 'I have heavy bleeding. Please send help immediately.',
      language: 'si',
      source: 'emergency',
      urgency: 'Emergency',
      urgencyScore: 90,
      status: 'handled',
      handledBy: doctorUsers[1]._id,
      handledAt: new Date(),
      isPinned: false,
    },
  ]);

  await MedicalNote.create({
    requestId: requests[4]._id,
    patientId: patients[1]._id,
    doctorId: doctors[1]._id,
    authorId: doctorUsers[1]._id,
    content: 'Bleeding controlled. Patient stable. Monitoring vitals.',
  });

  await AuditLog.create({
    action: 'SEED',
    entity: 'Database',
    userId: adminUser._id,
    details: { patients: 3, doctors: 2, wards: 3, templates: 8, requests: 5 },
  });

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@gesture.com / admin123');
  console.log('  Doctor:  dr.lee@medisign.com / doctor123');
  console.log('  Patient: arun@patient.com / patient123');
  console.log('  Patient: sita@patient.com / patient123');
  console.log('  Patient: john@patient.com / patient123\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
