// inventario.js

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
// Ruta para obtener el catálogo de medicamentos (NECESARIO)
router.get('/medicamentos', getMedicamentos);

// Ruta para obtener el catálogo de personal (NECESARIO)
router.get('/personal', getPersonal);


// --- INVENTARIO / DASHBOARD ---
// Ruta para el Inventario Dashboard (Requisito 2.1)
router.get('/', getInventarioGlobal);


// --- MOVIMIENTOS ---
// Ruta para Generar Entradas
router.post('/movimientos/entrada', createEntrada); 

// Ruta para Generar Salidas (FEFO)
// Nota: Usamos solo una función (registrarSalida) para evitar duplicidad
router.post('/movimientos/salida', registrarSalida); 


// --- UTILIDADES FEFO ---
// Ruta para obtener lotes disponibles ordenados por FEFO (Sugerencia)
router.get('/lotes/fefo', getLotesFEFO); 

// --- REPORTES ---

// 1. REPORTE DE CADUCIDADES (Ruta Única y Clara)
// Frontend llama a: /api/reporte/caducidades
router.get('/reporte/caducidades', getReporteCaducidades); 


// 2. REPORTE DE TRAZABILIDAD / HISTORIAL (Retorna JSON)
router.get('/reportes/historial', getHistorialMovimientos); 

// 3. REPORTE DE TRAZABILIDAD / HISTORIAL (Descarga PDF)
router.get('/reportes/historial/pdf', generateHistorialPDF); 

router.get('/movimientos/:id', getMovimientoById); 
router.put('/movimientos/entrada/:id', updateEntrada);


export default router;