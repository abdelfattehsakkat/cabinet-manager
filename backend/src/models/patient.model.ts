import mongoose, { Schema, Document } from 'mongoose';

interface PatientDocument {
    name: string;
    path: string;
    uploadDate: Date;
    type: string;
}

export interface IPatient extends Document {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    email?: string;
    phoneNumber: string;
    address?: string;
    medicalHistory?: {
        conditions: string[];
        allergies: string[];
        medications: string[];
        notes: string;
    };
    documents: PatientDocument[];
}

const patientSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    email: { type: String },
    phoneNumber: { type: String, required: true },
    address: { type: String },
    medicalHistory: {
        conditions: [String],
        allergies: [String],
        medications: [String],
        notes: String
    },
    documents: [{
        name: { type: String, required: true },
        path: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now },
        type: { type: String, required: true }
    }]
}, {
    timestamps: true
});

export default mongoose.model<IPatient>('Patient', patientSchema);