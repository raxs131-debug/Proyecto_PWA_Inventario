import mongoose from 'mongoose';

// Esquema para los detalles específicos de una SALIDA (Requiere 2.3)
const detalleSalidaSchema = new mongoose.Schema({
    lote: { type: String, required: true },
    cantidad: { type: Number, required: true, min: 1 },
    costoUnitario: { type: Number, required: false, default: 0 },
    caducidad: { type: Date, required: false },
});

// Esquema para los datos de una ENTRADA (Requisito 2.2 y 2.4)
const datosEntradaSchema = new mongoose.Schema({
    laboratorio: { type: String, required: true },
    costoUnitario: { type: Number, required: true, min: 0 },
    totalEnzimas: { type: Number, required: true, min: 1 }, // Cantidad que entra
    pedido: { type: String, required: true },
    factura: { type: String, required: true },
    proveedor: { type: String, required: true },
    lote: { type: String, required: true },
    caducidad: { type: Date, required: true },
    
    // Campos de Trazabilidad específicos para Entradas
    cantidadInicial: { type: Number, required: true, default: 0 }, // Cantidad original de esta entrada
    existenciaActual: { type: Number, required: true, default: 0 }, // Stock remanente de esta entrada (útil si se usa para salidas)
});

// Esquema para los datos de una SALIDA (Requisito 2.3)
const datosSalidaSchema = new mongoose.Schema({
    // 💡 CORRECCIÓN: Agregando 'Transferencia' al enum para validar el movimiento.
    // También ajusté 'Devolución' a 'Devolución a Proveedor' para ser más explícito.
    motivoSalida: { 
        type: String, 
        required: true, 
        enum: [
            'Administración a Paciente', 
            'Merma', 
            'Devolución a Proveedor', // Ajustado de 'Devolución'
            'Inventario',
            'Transferencia' // <-- ¡Añadido para resolver el error!
        ] 
    },
    cantidadEnzimasSalida: { type: Number, required: true, min: 1 },
    datosPaciente: { type: String, required: false, default: 'N/A' },
});


// -------------------------------------------------------------
// ESQUEMA PRINCIPAL DE MOVIMIENTO
// -------------------------------------------------------------
const movimientoSchema = new mongoose.Schema({
    // Campos comunes
    tipoMovimiento: { 
        type: String, 
        required: true, 
        enum: ['Entrada', 'Salida'],
        index: true,
    },
    claveCB: { 
        type: String, 
        required: true, 
        index: true 
    },
    fecha: { 
        type: Date, 
        default: Date.now,
        index: true
    },
    responsable: { 
        type: String, 
        required: true 
    },

    // Datos específicos de ENTRADA
    datosEntrada: {
        type: datosEntradaSchema,
        required: function() { return this.tipoMovimiento === 'Entrada'; }
    },

    // Datos específicos de SALIDA
    datosSalida: {
        type: datosSalidaSchema,
        required: function() { return this.tipoMovimiento === 'Salida'; }
    },
    
    // Detalles de la salida (si la salida consumió múltiples lotes)
    cantidadTotal: { type: Number, required: function() { return this.tipoMovimiento === 'Salida'; } },
    detalles: [detalleSalidaSchema],

}, {
    timestamps: true // Añade createdAt y updatedAt
});

const Movimiento = mongoose.model('Movimiento', movimientoSchema);

export default Movimiento;
