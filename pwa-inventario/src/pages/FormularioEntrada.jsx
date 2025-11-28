import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const initialFormData = {
    claveCB: '', 
    laboratorio: '',
    costoUnitario: 0,
    totalEnzimas: 0,
    pedido: '',
    factura: '',
    proveedor: '',
    lote: '',
    caducidad: '', 
    responsable: '',
};

const FormularioEntrada = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [medicamentos, setMedicamentos] = useState([]);
    const [personal, setPersonal] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(true);

    // useEffect para cargar los catálogos
    useEffect(() => {
        const fetchData = async () => {
            try {

                // 1. Cargar Catálogo de Medicamentos
                const medsResponse = await apiClient.get('/inventario/medicamentos'); // <--- RUTA CORREGIDA
                setMedicamentos(medsResponse.data);

                // 2. Cargar Lista de Personal
                const personalResponse = await apiClient.get('/inventario/personal');   // <--- RUTA CORREGIDA
                setPersonal(personalResponse.data);

                setLoading(false);
            } catch (error) {
                console.error("Error al cargar catálogos:", error);
                setMensaje('❌ Error al conectar con el servidor para cargar catálogos. Revisa la consola (F12) y el backend.');
                setLoading(false);
            }
        };

        fetchData();
    }, []); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        let parsedValue = value;
        if (name === 'costoUnitario' || name === 'totalEnzimas') {
            parsedValue = value === '' ? 0 : parseFloat(value);
        }
        
        setFormData({ ...formData, [name]: parsedValue });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');

        if (isNaN(formData.costoUnitario) || isNaN(formData.totalEnzimas) || formData.totalEnzimas <= 0) {
            setMensaje('❌ Error: El costo y la cantidad deben ser números válidos y mayores a cero.');
            return;
        }

        try {
            const response = await apiClient.post('/inventario/movimientos/entrada', formData);
            setMensaje(`✅ Éxito: ${response.data.message} Lote: ${formData.lote}`);
            setFormData(initialFormData); // Limpiar formulario
        } catch (error) {
            const msg = error.response?.data?.message || 'Error desconocido al registrar la entrada.';
            setMensaje(`❌ Error: ${msg}`);
            console.error('Error de API:', error.response || error);
        }
    };

    const medicamentoSeleccionado = medicamentos.find(m => m.claveCB === formData.claveCB);
        
    // Cálculo en tiempo real del Costo Total
    const costoUnitarioNum = parseFloat(formData.costoUnitario) || 0;
    const totalEnzimasNum = parseFloat(formData.totalEnzimas) || 0;
    const costoTotalCalculado = costoUnitarioNum * totalEnzimasNum;
        
    if (loading) return <h1>Cargando catálogos...</h1>;
    if (medicamentos.length === 0 && !mensaje.startsWith('❌')) {
        return <h1 style={{color: 'orange'}}>⚠️ Advertencia: No hay medicamentos en el catálogo. Por favor, añada uno.</h1>
    }
    
    return (
        <div style={{ padding: '20px' }}>
            <h1>Generar Entrada de Medicamentos</h1>
            {mensaje && <p style={{ padding: '10px', backgroundColor: mensaje.startsWith('✅') ? '#d4edda' : '#f8d7da', border: '1px solid', marginBottom: '20px' }}>{mensaje}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* COLUMNA 1 */}
        <div>
            <h2>Datos de Identificación</h2>
            <label>Clave de CB:</label>
            <select name="claveCB" value={formData.claveCB} onChange={handleChange} required>
                <option value="">Seleccione el medicamento</option>
                {medicamentos.map(med => (
                    <option key={med.claveCB} value={med.claveCB}>{med.claveCB} - {med.descripcion}</option>
                ))}
            </select>

            {/* Muestra datos del catálogo al seleccionar */}
            {medicamentoSeleccionado && (
                <>
                    <p>Descripción: <strong>{medicamentoSeleccionado.descripcion}</strong></p>
                    <p>Presentación: <strong>{medicamentoSeleccionado.presentacion}</strong></p>
                </>
            )}

            <label>Proveedor:</label>
            <input type="text" name="proveedor" value={formData.proveedor} onChange={handleChange} required />
            
            <label>Factura:</label>
            <input type="text" name="factura" value={formData.factura} onChange={handleChange} required />
            
            <label>Pedido:</label>
            <input type="text" name="pedido" value={formData.pedido} onChange={handleChange} required />
            
            <label>Laboratorio:</label>
            <input type="text" name="laboratorio" value={formData.laboratorio} onChange={handleChange} required />
        </div>

        {/* COLUMNA 2 */}
        <div>
            <h2>Datos del Lote y Cantidad</h2>
            <label>LOTE:</label>
            <input type="text" name="lote" value={formData.lote} onChange={handleChange} required />

            <label>CADUCIDAD:</label>
            <input type="date" name="caducidad" value={formData.caducidad} onChange={handleChange} required />

            <label>Costo Unitario:</label>
            <input type="number" name="costoUnitario" value={formData.costoUnitario} onChange={handleChange} min="0" step="0.01" required />

            <label>TOTAL DE ENZIMAS (Cantidad que Entra):</label>
            <input type="number" name="totalEnzimas" value={formData.totalEnzimas} onChange={handleChange} min="1" required />
                            
            <p style={{ 
                marginTop: '10px', padding: '10px', backgroundColor: '#e9ecef', 
                fontWeight: 'bold', borderLeft: '4px solid #007bff' 
            }}>
                Costo Total del Lote: ${costoTotalCalculado.toFixed(2)}
            </p>
                            
            <label>Responsable del Movimiento:</label>
            <select name="responsable" value={formData.responsable} onChange={handleChange} required>
            <option value="">Seleccione el responsable</option>
            {personal.length > 0 ? (
                personal.map((p, index) => (
                    <option key={p._id || index} value={p.nombre}>
                        {p.nombre} ({p.cargo})
                    </option>
                ))
            ) : (
                <option value="" disabled>⚠️ No se pudo cargar el personal (Revisar Backend)</option>
            )}
            </select>

            <button type="submit" style={{ marginTop: '30px', padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
                Registrar Entrada
            </button>
        </div>
        </form>
    </div>
    );
};

export default FormularioEntrada;