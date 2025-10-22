import mongoose, { Schema, Document } from 'mongoose';

export interface ITreatment extends Document {
    patientId: mongoose.Types.ObjectId;
    patientNumber: number;
    patientName: string; // Pour faciliter l'affichage
    treatmentDate: Date;
    dent: number; // Numéro de la dent (ex: 12, 23, 42)
    description: string;
    honoraire: number; // Montant des honoraires
    recu: number; // Montant reçu
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
    dent: { 
        type: Number, 
        required: true,
        min: 1,
        max: 48 // Numérotation dentaire standard
    },
    description: { 
        type: String, 
        required: true,
        trim: true
    },
    honoraire: { 
        type: Number,
        required: true,
        min: 0
    },
    recu: { 
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes par patient
treatmentSchema.index({ patientId: 1, treatmentDate: -1 });
treatmentSchema.index({ patientNumber: 1 });
treatmentSchema.index({ treatmentDate: -1 });

export default mongoose.model<ITreatment>('Treatment', treatmentSchema);