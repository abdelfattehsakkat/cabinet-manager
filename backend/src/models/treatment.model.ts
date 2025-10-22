import mongoose, { Schema, Document } from 'mongoose';

export interface ITreatment extends Document {
    patientId: mongoose.Types.ObjectId;
    patientNumber: number;
    patientName: string; // Pour faciliter l'affichage
    treatmentDate: Date;
    description: string;
    notes?: string;
    cost?: number;
    createdBy?: string; // ID du médecin/utilisateur
    createdAt: Date;
    updatedAt: Date;
}

const treatmentSchema = new Schema({
    patientId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Patient', 
        required: true 
    },
    patientNumber: { 
        type: Number, 
        required: true 
    },
    patientName: { 
        type: String, 
        required: true 
    },
    treatmentDate: { 
        type: Date, 
        required: true 
    },
    description: { 
        type: String, 
        required: true,
        trim: true
    },
    notes: { 
        type: String,
        trim: true
    },
    cost: { 
        type: Number,
        min: 0
    },
    createdBy: { 
        type: String 
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes par patient
treatmentSchema.index({ patientId: 1, treatmentDate: -1 });
treatmentSchema.index({ patientNumber: 1 });
treatmentSchema.index({ treatmentDate: -1 });

export default mongoose.model<ITreatment>('Treatment', treatmentSchema);