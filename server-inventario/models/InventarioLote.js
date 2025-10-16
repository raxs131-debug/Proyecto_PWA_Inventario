// server-inventario/models/InventarioLote.js

import mongoose from 'mongoose';

const InventarioLoteSchema = new mongoose.Schema({
    // Clave del Medicamento (referencia al catálogo Medicamento)
    claveCB: { 
        type: String, 
        required: true 
    },
    // ID del Lote específico
    lote: { 
        type: String, 
        required: true 
    },
    // Fecha de Caducidad (CRÍTICO para FEFO y el Reporte de Caducidades)
    caducidad: { 
        type: Date, 
        required: true 
    },
    // Cantidad actual en stock
    stock: { 
        type: Number, 
        required: true, 
        default: 0 
    },
    // Costo para cálculos de valor de inventario
    costoUnitario: { 
        type: Number, 
        required: true 
    },
    // Referencia al catálogo de Medicamentos para población en reportes
    medicamento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicamento'
    }
}, { 
    timestamps: true // Añade campos createdAt y updatedAt automáticamente
});

// Crear un índice único compuesto para prevenir duplicados de lotes
InventarioLoteSchema.index({ claveCB: 1, lote: 1 }, { unique: true });

const InventarioLote = mongoose.model('InventarioLote', InventarioLoteSchema);

export default InventarioLote;