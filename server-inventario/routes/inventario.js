import express from 'express';
import { 
    getInventarioGlobal, 
    createEntrada, 
    getPersonal, 
    getMedicamentos,
    getLotesFEFO,
    registrarSalida, 
    getHistorialMovimientos,
    getReporteCaducidades,
    generateHistorialPDF,
    getMovimientoById,
    updateEntrada
} from '../controllers/inventarioController.js'; 

const router = express.Router();

// --- CATÁLOGOS ---
router.get('/medicamentos', getMedicamentos);

// Ruta para obtener el catálogo de personal 
router.get('/personal', getPersonal);


// --- INVENTARIO ---
// Ruta para el Inventario 
router.get('/', getInventarioGlobal);


// --- MOVIMIENTOS ---
// Ruta para Generar Entradas
router.post('/movimientos/entrada', createEntrada); 

// Ruta para Generar Salidas (FEFO)
router.post('/movimientos/salida', registrarSalida); 


// --- UTILIDADES FEFO ---
router.get('/lotes/fefo', getLotesFEFO); 

// --- REPORTES ---

// 1. REPORTE DE CADUCIDADES 
router.get('/reporte/caducidades', getReporteCaducidades); 


// 2. REPORTE DE TRAZABILIDAD / HISTORIAL 
router.get('/reportes/historial', getHistorialMovimientos); 

// 3. REPORTE DE TRAZABILIDAD / HISTORIAL (Descarga PDF)
router.get('/reportes/historial/pdf', generateHistorialPDF); 

router.get('/movimientos/:id', getMovimientoById); 
router.put('/movimientos/entrada/:id', updateEntrada);


export default router;