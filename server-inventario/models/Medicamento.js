import mongoose from 'mongoose';

const MedicamentoSchema = new mongoose.Schema({
    claveCB: { type: String, required: true, unique: true },
    descripcion: { type: String, required: true },
    presentacion: { type: String, required: true },
    unidadMedida: { type: String, default: 'mg' }, // Podría ser 'mg', 'UI', etc.
});

export default mongoose.model('Medicamento', MedicamentoSchema);