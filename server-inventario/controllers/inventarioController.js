import Movimiento from '../models/Movimiento.js';
import Medicamento from '../models/Medicamento.js';
import Personal from '../models/Personal.js';
import InventarioLote from '../models/InventarioLote.js';
import PDFDocument from 'pdfkit'; 

export const getInventarioGlobal = async (req, res) => {
    try {
        // 1. USAR InventarioLote: Agrupar por claveCB y sumar el stock
        const inventarioLotes = await InventarioLote.aggregate([
            { $match: { stock: { $gt: 0 } } }, // Solo lotes con stock positivo
            {
                $group: {
                    _id: "$claveCB",
                    totalEnzimas: { $sum: "$stock" }
                }
            }
        ]);

        // 2. Obtener los detalles del catálogo para cada medicamento con inventario
        const clavesConInventario = inventarioLotes.map(item => item._id);

        const catalogo = await Medicamento.find({
            claveCB: { $in: clavesConInventario }
        }).select('claveCB descripcion presentacion unidadMedida'); 

        const inventarioMap = inventarioLotes.reduce((acc, item) => {
            acc[item._id] = item.totalEnzimas;
            return acc;
        }, {});

        // 3. Combinar la data del catálogo con el total de enzimas calculado
        const inventarioFinal = catalogo.map(med => ({
            claveCB: med.claveCB,
            descripcion: med.descripcion,
            presentacion: med.presentacion,
            totalEnzimas: inventarioMap[med.claveCB] || 0 
        }));

        res.json(inventarioFinal);

    } catch (error) {
        console.error('Error al calcular el inventario global:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener inventario.' });
    }
};

export const createEntrada = async (req, res) => {
    const { 
        claveCB, laboratorio, costoUnitario, totalEnzimas, pedido, factura, 
        proveedor, lote, caducidad, responsable 
    } = req.body;

    try {
        const medicamento = await Medicamento.findOne({ claveCB });
        if (!medicamento) {
            return res.status(404).json({ message: 'Medicamento no encontrado en el catálogo.' });
        }
        
        const cantidadQueEntra = parseFloat(totalEnzimas);
        const fechaCaducidad = new Date(caducidad);

        let inventarioLote = await InventarioLote.findOne({ claveCB, lote });

        if (inventarioLote) {
            // Si el lote existe, suma stock y actualiza caducidad/costo (por si cambió)
            inventarioLote.stock += cantidadQueEntra;
            inventarioLote.costoUnitario = parseFloat(costoUnitario);
            inventarioLote.caducidad = fechaCaducidad;

            await inventarioLote.save();

        } else {
            // Si el lote es nuevo, crearlo
            inventarioLote = new InventarioLote({
                claveCB: claveCB,
                lote: lote,
                caducidad: fechaCaducidad,
                stock: cantidadQueEntra,
                costoUnitario: parseFloat(costoUnitario),
            });
            await inventarioLote.save(); 
        }

        // *** LÓGICA DE TRAZABILIDAD: REGISTRAR EL MOVIMIENTO (Movimiento) ***
        const nuevoMovimiento = new Movimiento({
            tipoMovimiento: 'Entrada',
            claveCB: claveCB,
            responsable: responsable,
            datosEntrada: {
                laboratorio,
                costoUnitario: parseFloat(costoUnitario),
                totalEnzimas: cantidadQueEntra,
                pedido,
                factura,
                proveedor,
                lote,
                caducidad: fechaCaducidad, 
                cantidadInicial: cantidadQueEntra,
                existenciaActual: cantidadQueEntra, 
            },
        });

        await nuevoMovimiento.save();
        
        res.status(201).json({ 
            message: 'Entrada registrada y lote actualizado exitosamente.', 
            movimiento: nuevoMovimiento 
        });

    } catch (error) {
        console.error('Error al registrar la entrada:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar entrada.', error: error.message });
    }
};

export const getMedicamentos = async (req, res) => {
    try {
        const medicamentosList = await Medicamento.find().select('claveCB descripcion presentacion unidadMedida');
        res.json(medicamentosList);
    } catch (error) {
        console.error('Error al obtener el catálogo de medicamentos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener medicamentos.' });
    }
};

export const getPersonal = async (req, res) => {
    try {
        const personalList = await Personal.find().sort({ nombre: 1 });
        res.json(personalList);
    } catch (error) {
        console.error('Error al obtener lista de personal:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener personal.' });
    }
};

export const getLotesFEFO = async (req, res) => {
    const { claveCB } = req.query; 

    if (!claveCB) {
        return res.status(400).json({ message: 'Se requiere la claveCB para obtener lotes FEFO.' }); 
    }

    try {
        const lotes = await InventarioLote.find({
            claveCB: claveCB,
            stock: { $gt: 0 } 
        })
        .sort({ caducidad: 1 }) 
        .select('lote caducidad stock costoUnitario');
        
        if (lotes.length === 0) {
            return res.status(404).json({ message: 'No hay lotes activos para este medicamento.' });
        }
        
        const lotesFormateados = lotes.map(lote => ({
            loteId: lote.lote,
            caducidad: lote.caducidad,
            existenciaActual: lote.stock,
            costoUnitario: lote.costoUnitario 
        }));

        res.json(lotesFormateados);

    } catch (error) {
        console.error('Error al obtener lotes FEFO:', error);
        res.status(500).json({ message: 'Error interno del servidor.' }); 
    }
};

export const registrarSalida = async (req, res) => {
    const { claveCB, cantidad, responsable, motivo, datosPaciente } = req.body;
    const cantidadRequerida = parseFloat(cantidad);

    if (cantidadRequerida <= 0 || isNaN(cantidadRequerida)) {
        return res.status(400).json({ message: 'La cantidad debe ser un número válido y mayor a cero.' });
    }

    try {
        // 1. Encontrar lotes disponibles (FEFO)
        const lotesDisponibles = await InventarioLote.find({
            claveCB,
            stock: { $gt: 0 }
        }).sort({ caducidad: 1 });

        // 2. Calcular stock total para validar
        const stockTotal = lotesDisponibles.reduce((sum, lote) => sum + lote.stock, 0);

        if (stockTotal < cantidadRequerida) {
            return res.status(400).json({ message: `Stock insuficiente. Disponible: ${stockTotal}` });
        }

        // 3. Procesar la salida utilizando FEFO
        let cantidadPendiente = cantidadRequerida;
        const movimientosDeSalida = [];

        for (const lote of lotesDisponibles) {
            if (cantidadPendiente === 0) break;

            const cantidadTomada = Math.min(lote.stock, cantidadPendiente);
            
            lote.stock -= cantidadTomada;
            await lote.save(); 

            movimientosDeSalida.push({
                lote: lote.lote,
                cantidad: cantidadTomada,
                costoUnitario: lote.costoUnitario,
                caducidad: lote.caducidad
            });
            
            cantidadPendiente -= cantidadTomada;
        }

        const datosPacienteValue = (motivo === 'Administración a Paciente' && datosPaciente) 
            ? datosPaciente 
            : 'N/A'; 

        const nuevoMovimiento = new Movimiento({
            tipoMovimiento: 'Salida',
            claveCB: claveCB,
            fecha: new Date(),
            responsable,
            cantidadTotal: cantidadRequerida,
            detalles: movimientosDeSalida, 
            datosSalida: { 
                motivoSalida: motivo, 
                cantidadEnzimasSalida: cantidadRequerida, 
                datosPaciente: datosPacienteValue
            }
        });
        await nuevoMovimiento.save();

        res.status(200).json({ 
            message: `Salida de ${cantidadRequerida} unidades de ${claveCB} registrada exitosamente usando FEFO.`,
            detalles: movimientosDeSalida 
        });

    } catch (error) {
        console.error('Error al registrar salida FEFO:', error);
            if (error.name === 'ValidationError') {
            console.error('Detalles de la validación de Mongoose:', error.errors);
            return res.status(400).json({ 
                message: 'Error de validación al registrar el movimiento. Revise el esquema.', 
                details: error.errors 
            });
        }
        
        // Incluir el mensaje de error para ayudar a la depuración del cliente
        res.status(500).json({ 
            message: 'Error interno del servidor al procesar la salida.', 
            error: error.message 
        });
    }
};

export const getMovimientoById = async (req, res) => {
    try {
        const movimiento = await Movimiento.findById(req.params.id);

        if (!movimiento) {
            return res.status(404).json({ message: 'Movimiento no encontrado.' });
        }

        const medicamento = await Medicamento.findOne({ claveCB: movimiento.claveCB });
        const responsable = await Personal.findOne({ nombre: movimiento.responsable }); 

        const datosCompletos = {
            ...movimiento.toObject(),
            descripcion: medicamento?.descripcion || 'N/A',
            presentacion: medicamento?.presentacion || 'N/A',
            unidadMedida: medicamento?.unidadMedida || 'N/A',
            responsableID: responsable?._id || 'N/A' 
        };

        res.json(datosCompletos);

    } catch (error) {
        console.error('Error al obtener movimiento por ID:', error);
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'ID de movimiento no válido.' });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Modifica un movimiento de entrada existente, revirtiendo el stock original y aplicando el nuevo.
 */
export const updateEntrada = async (req, res) => {
    const { id } = req.params;
    const { 
        claveCB, costoUnitario, totalEnzimas, pedido, factura, 
        proveedor, lote, caducidad, responsable, laboratorio 
    } = req.body;

    try {
        // 1. ENCONTRAR MOVIMIENTO ORIGINAL
        const movimientoOriginal = await Movimiento.findById(id);

        if (!movimientoOriginal || movimientoOriginal.tipoMovimiento !== 'Entrada') {
            return res.status(404).json({ message: 'Movimiento de Entrada original no encontrado o no es una Entrada.' });
        }

        // Datos Originales y Nuevos
        const loteOriginal = movimientoOriginal.datosEntrada.lote;
        const cantidadOriginal = movimientoOriginal.datosEntrada.totalEnzimas;
        const nuevaCantidad = parseFloat(totalEnzimas);
        const nuevoCosto = parseFloat(costoUnitario);
        const nuevaCaducidad = new Date(caducidad);

        if (isNaN(nuevaCantidad) || nuevaCantidad <= 0 || isNaN(nuevoCosto) || nuevaCantidad <= 0) {
            return res.status(400).json({ message: 'Cantidad y Costo deben ser números válidos y positivos.' });
        }

        // 2. REVERTIR: Restar la cantidad original al lote
        const loteAfectadoOriginal = await InventarioLote.findOne({ claveCB: movimientoOriginal.claveCB, lote: loteOriginal });

        if (loteAfectadoOriginal) {
            // Asegurarse de que el stock no sea negativo (aunque podría ser por un error previo)
            loteAfectadoOriginal.stock -= cantidadOriginal; 
            await loteAfectadoOriginal.save();
        } 
        
        // 3. ACTUALIZAR: Modificar el documento Movimiento (Trazabilidad)
        const movimientoActualizado = await Movimiento.findByIdAndUpdate(
            id,
            {
                responsable: responsable,
                claveCB: claveCB, 
                'datosEntrada.laboratorio': laboratorio,
                'datosEntrada.costoUnitario': nuevoCosto,
                'datosEntrada.totalEnzimas': nuevaCantidad,
                'datosEntrada.pedido': pedido,
                'datosEntrada.factura': factura,
                'datosEntrada.proveedor': proveedor,
                'datosEntrada.lote': lote, 
                'datosEntrada.caducidad': nuevaCaducidad,
                'datosEntrada.existenciaActual': nuevaCantidad, 
                updatedAt: new Date() 
            },
            { new: true, runValidators: true } 
        );

        if (!movimientoActualizado) {
            return res.status(404).json({ message: 'Error al encontrar el movimiento para actualizar.' });
        }

        // 4. APLICAR: Sumar la nueva cantidad al nuevo/mismo lote
        let loteAfectadoNuevo = await InventarioLote.findOne({ claveCB, lote });

        if (loteAfectadoNuevo) {
            loteAfectadoNuevo.stock += nuevaCantidad;
            loteAfectadoNuevo.costoUnitario = nuevoCosto;
            loteAfectadoNuevo.caducidad = nuevaCaducidad;
            
        } else {
            // Si es un lote completamente nuevo (cambio de lote), crearlo
            loteAfectadoNuevo = new InventarioLote({
                claveCB: claveCB,
                lote: lote,
                caducidad: nuevaCaducidad,
                stock: nuevaCantidad,
                costoUnitario: nuevoCosto,
            });
        }
        await loteAfectadoNuevo.save();
        

        res.status(200).json({ 
            message: 'Entrada modificada y stock de lote actualizado exitosamente.', 
            movimiento: movimientoActualizado 
        });

    } catch (error) {
        console.error('Error al modificar la entrada:', error);
        res.status(500).json({ message: 'Error interno del servidor al modificar entrada.', error: error.message });
    }
};

export const getReporteCaducidades = async (req, res) => {
    try {
        const lotes = await InventarioLote.find({
            stock: { $gt: 0 } 
        })
        .sort({ caducidad: 1 });

        // Obtener detalles del catálogo para enriquecer
        const clavesUnicas = [...new Set(lotes.map(l => l.claveCB))];
        const catalogo = await Medicamento.find({ claveCB: { $in: clavesUnicas } }).select('claveCB descripcion presentacion');
        const catalogoMap = catalogo.reduce((acc, med) => {
            acc[med.claveCB] = med;
            return acc;
        }, {});

        const hoy = new Date();
        const lotesConSemaforo = lotes.map(lote => {
            const caducidad = new Date(lote.caducidad);
            const diffTime = caducidad.getTime() - hoy.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const detallesMed = catalogoMap[lote.claveCB] || {};

            // Lógica del Semáforo: 🟢 > 6 meses (180 días), 🟡 3-6 meses (90-180 días), 🔴 < 3 meses (90 días o menos) o caducado
            let semaforo;
            if (diffDays <= 0) {
                 semaforo = 'Caducado'; // Vencido 
            } else if (diffDays <= 90) {
                 semaforo = 'Rojo'; // Vencimiento crítico (menos de 3 meses)
            } else if (diffDays <= 180) {
                 semaforo = 'Amarillo'; // Advertencia (entre 3 y 6 meses)
            } else {
                 semaforo = 'Verde'; // Seguro (más de 6 meses)
            }

            return {
                claveCB: lote.claveCB,
                descripcion: detallesMed.descripcion || 'N/A',
                presentacion: detallesMed.presentacion || 'N/A',
                lote: lote.lote,
                stock: lote.stock,
                caducidad: lote.caducidad,
                diasParaVencer: diffDays,
                semaforo: semaforo
            };
        });

        res.status(200).json(lotesConSemaforo);

    } catch (error) {
        console.error('Error al obtener reporte de caducidades:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


export const getHistorialMovimientos = async (req, res) => {
    const { tipo, fechaInicio, fechaFin } = req.query; 
    const query = {};
    // Filtro por TIPO DE MOVIMIENTO
    if (tipo && (tipo === 'Entrada' || tipo === 'Salida')) {
        query.tipoMovimiento = tipo;
    } 

    // Filtro por PERIODO DE TIEMPO
    if (fechaInicio || fechaFin) {
    query.fecha = {};
    if (fechaInicio) {
        const dateInicio = new Date(fechaInicio);
        dateInicio.setUTCHours(0, 0, 0, 0); 
        query.fecha.$gte = dateInicio; 
    }
    
    if (fechaFin) {
        const dateFin = new Date(fechaFin);
        dateFin.setUTCHours(0, 0, 0, 0); 
        dateFin.setDate(dateFin.getDate() + 1); 
        query.fecha.$lt = dateFin; 
    }
}

    try {
        const movimientos = await Movimiento.find(query) 
            .sort({ fecha: -1 }) 
            .limit(500); 

        const clavesUnicas = [...new Set(movimientos.map(m => m.claveCB))];
        const catalogo = await Medicamento.find({ claveCB: { $in: clavesUnicas } }).select('claveCB descripcion presentacion');
        
        const catalogoMap = catalogo.reduce((acc, med) => {
            acc[med.claveCB] = med;
            return acc;
        }, {});

        const historialEnriquecido = movimientos.map(mov => {
            const detallesMed = catalogoMap[mov.claveCB] || {};
                let cantidad, lotesAfectados, motivoSalida;
                if (mov.tipoMovimiento === 'Entrada') {
                    cantidad = mov.datosEntrada?.totalEnzimas || 'N/A';
                    lotesAfectados = mov.datosEntrada?.lote || 'N/A';
                    motivoSalida = 'Entrada (Registro)';
                } else {
                    cantidad = mov.cantidadTotal || 'N/A';
                    motivoSalida = mov.datosSalida?.motivoSalida || 'N/A'; 
                    lotesAfectados = mov.detalles ? mov.detalles.map(d => `${d.lote} (${d.cantidad})`).join(', ') : 'N/A';
                }

            return {
                _id: mov._id,
                tipoMovimiento: mov.tipoMovimiento,
                claveCB: mov.claveCB,
                descripcion: detallesMed.descripcion || 'N/A',
                presentacion: detallesMed.presentacion || 'N/A',
                fecha: mov.fecha ? mov.fecha.toISOString() : 'N/A',
                responsable: mov.responsable,
                
                detalles: {
                    cantidad: cantidad,
                    motivo: motivoSalida,
                    lotesAfectados: lotesAfectados,
                    ... (mov.tipoMovimiento === 'Entrada' ? {
                        caducidad: mov.datosEntrada && mov.datosEntrada.caducidad ? mov.datosEntrada.caducidad.toISOString().split('T')[0] : 'N/A',
                        existenciaActual: mov.datosEntrada?.existenciaActual || 'N/A'
                    } : {})
                }
            };
        });

        res.json(historialEnriquecido);

    } catch (error) {
        console.error('Error al obtener el historial de movimientos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener historial.' });
    }
};

export const generateHistorialPDF = async (req, res) => {
    const { tipo, fechaInicio, fechaFin } = req.query; 

    const query = {};

    if (tipo && (tipo === 'Entrada' || tipo === 'Salida')) {
        query.tipoMovimiento = tipo;
    } 
    if (fechaInicio || fechaFin) {
        query.fecha = {};
        if (fechaInicio) {
            query.fecha.$gte = new Date(fechaInicio);
        }
        if (fechaFin) {
            const dateFin = new Date(fechaFin);
            dateFin.setDate(dateFin.getDate() + 1); 
            query.fecha.$lte = dateFin; 
        }
    }
    
    try {
        const movimientos = await Movimiento.find(query)
            .sort({ fecha: -1 })
            .limit(500); 

        const clavesUnicas = [...new Set(movimientos.map(m => m.claveCB))];
        const catalogo = await Medicamento.find({ claveCB: { $in: clavesUnicas } }).select('claveCB descripcion presentacion unidadMedida');
        
        const catalogoMap = catalogo.reduce((acc, med) => {
            acc[med.claveCB] = med;
            return acc;
        }, {});

        const historialParaPDF = movimientos.map(mov => {
            const detallesMed = catalogoMap[mov.claveCB] || {};
            const fecha = new Date(mov.fecha).toLocaleDateString('es-MX');
            const tipo = mov.tipoMovimiento || mov.tipo;

            const datos = (tipo === 'Entrada') ? 
                `Lote: ${mov.datosEntrada ? mov.datosEntrada.lote : 'N/A'}, Cantidad: ${mov.datosEntrada ? mov.datosEntrada.totalEnzimas : 'N/A'}, Cad.: ${mov.datosEntrada && mov.datosEntrada.caducidad ? new Date(mov.datosEntrada.caducidad).toLocaleDateString('es-MX') : 'N/A'}` : 
                `Cantidad: ${mov.cantidadTotal || 'N/A'}, Motivo: ${mov.datosSalida?.motivoSalida || 'N/A'}, Lotes: ${mov.detalles ? mov.detalles.map(d => `${d.lote} (${d.cantidad})`).join(', ') : 'N/A'}`;

            return {
                tipo: tipo,
                fecha: fecha,
                clave: mov.claveCB,
                descripcion: detallesMed.descripcion || 'N/A',
                responsable: mov.responsable,
                detalles: datos
            };
        });

        // Generación del PDF
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Historial_Inventario.pdf"');

        doc.pipe(res); 

        doc.fontSize(16).text('Reporte de Trazabilidad y Movimientos de Inventario', { align: 'center' });
        doc.fontSize(10).text(`Filtro: Tipo=${tipo || 'Ambos'}, Periodo=${fechaInicio || 'Inicio'} a ${fechaFin || 'Fin'}`, { align: 'center' });
        doc.moveDown(1.5);

        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 120;
        const col3 = 200;
        const col4 = 300;
        const col5 = 380;
        const col6 = 470;

        doc.fillColor('#343a40')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('Tipo', col1, tableTop, { width: 60 })
        .text('Fecha', col2, tableTop, { width: 80 })
        .text('Clave', col3, tableTop, { width: 70 })
        .text('Responsable', col4, tableTop, { width: 80 })
        .text('Descripción', col5, tableTop, { width: 80 })
        .text('Detalles', col6, tableTop, { width: 100 });
        
        doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke('#ccc');

        doc.moveDown(0.5);
        let currentY = doc.y;

        // Cuerpo de la tabla
        doc.font('Helvetica');
        historialParaPDF.forEach(item => {
            const requiredHeight = doc.heightOfString(item.detalles, { width: 150 }) + 10;
            if (currentY + requiredHeight > 750) { 
                doc.addPage();
                currentY = 50; 
                
                // Redibujar cabecera
                doc.fillColor('#343a40')
                .font('Helvetica-Bold')
                .fontSize(9)
                .text('Tipo', col1, currentY, { width: 60 })
                .text('Fecha', col2, currentY, { width: 80 })
                .text('Clave', col3, currentY, { width: 70 })
                .text('Responsable', col4, currentY, { width: 80 })
                .text('Descripción', col5, currentY, { width: 80 })
                .text('Detalles', col6, currentY, { width: 100 });
                doc.moveTo(col1, currentY + 15).lineTo(550, currentY + 15).stroke('#ccc');
                currentY += 25; 
            }

            doc.fillColor('#000')
            .fontSize(8)
            .text(item.tipo, col1, currentY, { width: 60, continued: false })
            .text(item.fecha, col2, currentY, { width: 70, continued: false })
            .text(item.clave, col3, currentY, { width: 70, continued: false })
            .text(item.responsable, col4, currentY, { width: 70, continued: false })
            .text(item.descripcion, col5, currentY, { width: 80, continued: false })
            .text(item.detalles, col6, currentY, { width: 150, continued: false });
            
            const nextY = currentY + requiredHeight;
            currentY = nextY > currentY + 25 ? nextY : currentY + 25; 
            
            doc.moveTo(col1, currentY - 5).lineTo(550, currentY - 5).stroke('#eee');
        });

        // Finalizar y enviar el documento
        doc.end();

    } catch (error) {
        console.error('Error al generar el PDF del historial:', error);
        res.status(500).json({ message: 'Error interno del servidor al generar el PDF.', error: error.message });
    }
};