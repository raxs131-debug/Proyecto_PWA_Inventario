import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

const initialSalidaData = {
    claveCB: '',
    cantidadEnzimasSalida: '', 
    motivoSalida: '', 
    responsable: '',
    datosPaciente: {
        nombre: '',
        edad: '', 
        diagnostico: '',
        dosis: '',
        frecuencia: '',
        doctor: '',
        folioReceta: ''
    }
};

const FormularioSalida = () => {
    const [formData, setFormData] = useState(initialSalidaData);
    const [medicamentos, setMedicamentos] = useState([]);
    const [personal, setPersonal] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [lotesSugeridos, setLotesSugeridos] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [existenciaActual, setExistenciaActual] = useState(0);

    const fetchLotesAndExistence = useCallback(async (claveCB) => {
        try {
            setLotesSugeridos([]);
            setExistenciaActual(0);
            if (!claveCB) return;

            const lotesRes = await apiClient.get(`/inventario/lotes/fefo?claveCB=${claveCB}`); 
            const lotesData = lotesRes.data || []; 
            
            const total = lotesData.reduce((sum, lote) => sum + lote.existenciaActual, 0);
            
            setLotesSugeridos(lotesData);
            setExistenciaActual(total);
            
        } catch (error) {
            console.error("Error al obtener lotes/existencia:", error);
            const msg = error.response?.data?.message || 'Error: No hay lotes activos para este medicamento o error de conexión.';
            setMensaje(`❌ ${msg}`);
            setLotesSugeridos([]);
            setExistenciaActual(0);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [medsRes, personalRes] = await Promise.all([
                    apiClient.get('/inventario/medicamentos'),
                    apiClient.get('/inventario/personal')
                ]);
                setMedicamentos(medsRes.data);
                setPersonal(personalRes.data);
            } catch (error) {
                console.error("Error al cargar catálogos:", error);
                setMensaje('❌ Error al cargar catálogos.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (formData.claveCB) {
            fetchLotesAndExistence(formData.claveCB);
        } else {
            setLotesSugeridos([]);
            setExistenciaActual(0);
        }
    }, [formData.claveCB, fetchLotesAndExistence]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name in initialSalidaData.datosPaciente) {
            setFormData({ 
                ...formData, 
                datosPaciente: { ...formData.datosPaciente, [name]: value } 
            });
        } else {
            const parsedValue = (name === 'cantidadEnzimasSalida' || name === 'edad') ? parseFloat(value) : value;
            setFormData({ ...formData, [name]: parsedValue });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');

        if (formData.cantidadEnzimasSalida > existenciaActual) {
            setMensaje(`❌ Error: La cantidad (${formData.cantidadEnzimasSalida}) excede la existencia total (${existenciaActual}).`);
            return;
        }

        try {
            const dataToSend = {
                claveCB: formData.claveCB,
                cantidad: formData.cantidadEnzimasSalida, 
                responsable: formData.responsable,
                motivo: formData.motivoSalida,                 
                datosPaciente: formData.motivoSalida === 'Administración a Paciente' 
                    ? JSON.stringify(formData.datosPaciente) 
                    : undefined
            };

            const response = await apiClient.post('/inventario/movimientos/salida', dataToSend);
            
            const lotesInfo = response.data.detalles ? 
                                    response.data.detalles.map(l => `${l.lote} (${l.cantidad})`).join(', ') : 
                                    'N/A';

            setMensaje(`✅ Éxito: Salida registrada. Lotes afectados: ${lotesInfo}`);
            setFormData(initialSalidaData); 
            fetchLotesAndExistence(formData.claveCB);
            
        } catch (error) {
            const msg = error.response?.data?.message || 'Error desconocido al registrar la salida.';
            setMensaje(`❌ Error: ${msg}`);
            console.error('Error de API:', error.response || error);
        }
    };

    const medicamentoSeleccionado = medicamentos.find(m => m.claveCB === formData.claveCB);
    const mostrarDatosPaciente = formData.motivoSalida === 'Administración a Paciente';
    
    if (loading) return <h1>Cargando catálogos...</h1>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Generar Salida de Medicamentos (Lógica FEFO)</h1>
            {mensaje && <p style={{ padding: '10px', backgroundColor: mensaje.startsWith('✅') ? '#d4edda' : '#f8d7da', border: '1px solid', marginBottom: '20px' }}>{mensaje}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* COLUMNA 1: Datos de Salida */}
                <div>
                    <h2>Datos de Movimiento</h2>
                    <label>Clave de CB:</label>
                    <select name="claveCB" value={formData.claveCB} onChange={handleChange} required>
                        <option value="">Seleccione el medicamento</option>
                        {medicamentos.map(med => (
                            <option key={med.claveCB} value={med.claveCB}>{med.claveCB} - {med.descripcion}</option>
                        ))}
                    </select>
                    
                    {medicamentoSeleccionado && (
                        <p style={{ fontWeight: 'bold' }}>Existencia Total: {existenciaActual} unidades. (Presentación: {medicamentoSeleccionado?.presentacion})</p>
                    )}
                    
                    <label>TOTAL DE UNIDADES (Cantidad a Salir):</label>
                    <input 
                        type="number" 
                        name="cantidadEnzimasSalida" 
                        value={formData.cantidadEnzimasSalida || ''} 
                        onChange={handleChange} 
                        min="1" 
                        max={existenciaActual}
                        required 
                    />

                    <label>Motivo de Salida:</label>
                    <select name="motivoSalida" value={formData.motivoSalida} onChange={handleChange} required>
                        <option value="">Seleccione el motivo</option>
                        <option value="Administración a Paciente">Administración a Paciente</option>
                        <option value="Merma">Merma/Caducidad</option> {/* Valor Mongoose 'Merma' */}
                        <option value="Devolución">Devolución</option> {/* Valor Mongoose 'Devolución' */}
                        <option value="Inventario">Ajuste de Inventario</option> {/* Valor Mongoose 'Inventario' */}
                    </select>
                    
                    <label>Responsable del Movimiento:</label>
                    <select name="responsable" value={formData.responsable} onChange={handleChange} required>
                        <option value="">Seleccione el responsable</option>
                        {personal.map(p => (
                            <option key={p.id} value={p.nombre}>{p.nombre} ({p.cargo})</option>
                        ))}
                    </select>
                    
                    <h3 style={{marginTop: '20px'}}>Sugerencia FEFO (Para cumplimiento)</h3>
                    {lotesSugeridos.length > 0 ? (
                        <p>El lote más próximo a caducar es: 
                            <strong>{lotesSugeridos[0].lote || lotesSugeridos[0].loteId}</strong>, 
                            Caduca: {new Date(lotesSugeridos[0].caducidad).toLocaleDateString('es-MX')}. 
                            Existencia: {lotesSugeridos[0].existenciaActual}
                        </p>
                    ) : (
                        <p>No hay lotes activos para esta clave.</p>
                    )}
                    
                    <button type="submit" style={{ marginTop: '30px', padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Registrar Salida
                    </button>
                </div>

                {/* COLUMNA 2: Datos del Paciente (Condicional) */}
                {mostrarDatosPaciente && (
                    <div>
                        <h2>Datos del Paciente</h2>
                        <label>Nombre del Paciente:</label>
                        <input type="text" name="nombre" value={formData.datosPaciente.nombre} onChange={handleChange} required={mostrarDatosPaciente} />
                        
                        <label>Edad:</label>
                        <input type="number" name="edad" value={formData.datosPaciente.edad} onChange={handleChange} min="0" required={mostrarDatosPaciente} />
                        
                        <label>Diagnóstico:</label>
                        <input type="text" name="diagnostico" value={formData.datosPaciente.diagnostico} onChange={handleChange} required={mostrarDatosPaciente} />

                        <label>Dosis:</label>
                        <input type="text" name="dosis" value={formData.datosPaciente.dosis} onChange={handleChange} required={mostrarDatosPaciente} />

                        <label>Frecuencia:</label>
                        <input type="text" name="frecuencia" value={formData.datosPaciente.frecuencia} onChange={handleChange} required={mostrarDatosPaciente} />

                        <label>Medicó:</label>
                        <input type="text" name="doctor" value={formData.datosPaciente.doctor} onChange={handleChange} required={mostrarDatosPaciente} />
                        
                        <label>Folio de Receta:</label>
                        <input type="text" name="folioReceta" value={formData.datosPaciente.folioReceta} onChange={handleChange} required={mostrarDatosPaciente} />
                    </div>
                )}
            </form>
        </div>
    );
};

export default FormularioSalida;