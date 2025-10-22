import mongoose, { Schema, Document } from 'mongoose';

interface PatientDocument {
    name: string;
    path: string;
    uploadDate: Date;
    type: string;
}

export interface IPatient extends Document {
    patientNumber: number;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    email?: string;
    phoneNumber?: string;  // Optionnel
    address?: string;      // Optionnel
    medicalHistory?: {
        conditions: string[];
        allergies: string[];
        medications: string[];
        notes: string;
    };
    documents: PatientDocument[];
}

const patientSchema = new Schema({
    patientNumber: { type: Number, unique: true, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    email: { type: String },
    phoneNumber: { type: String },  // Plus obligatoire
    address: { type: String },      // Plus obligatoire
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