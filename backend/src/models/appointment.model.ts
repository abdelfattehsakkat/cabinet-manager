import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
    patient?: mongoose.Types.ObjectId;
    doctor: mongoose.Types.ObjectId;
    patientFirstName: string;
    patientLastName: string;
    patientNumber?: string;
    date: Date;
    duration: number; // in minutes
    status: 'scheduled' | 'completed' | 'cancelled' | 'noShow';
    type: string;
    notes?: string;
}

const appointmentSchema = new Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: false
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    patientFirstName: {
        type: String,
        required: true
    },
    patientLastName: {
        type: String,
        required: true
    },
    patientNumber: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        default: 30
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'noShow'],
        default: 'scheduled'
    },
    type: {
        type: String,
        required: true
    },
    notes: String
}, {
    timestamps: true
});

// Index to improve query performance
appointmentSchema.index({ date: 1, doctor: 1 });
appointmentSchema.index({ patient: 1, date: 1 });

export default mongoose.model<IAppointment>('Appointment', appointmentSchema);