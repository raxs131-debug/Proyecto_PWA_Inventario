import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
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

const FormularioModificarEntrada = () => {
    const { id } = useParams(); 
    const navigate = useNavigate(); 
    
    const [formData, setFormData] = useState(initialFormData);
    const [medicamentos, setMedicamentos] = useState([]);
    const [personal, setPersonal] = useState([]); 
    const [mensaje, setMensaje] = useState('');
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false); 

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Cargar Catálogo de Medicamentos y Personal (Rutas corregidas)
                const [medsResponse, personalResponse] = await Promise.all([
                    apiClient.get('/inventario/medicamentos'),
                    apiClient.get('/inventario/personal')
                ]);
                setMedicamentos(medsResponse.data);
                setPersonal(personalResponse.data);

                // 2. Cargar DATOS DEL MOVIMIENTO ORIGINAL
                if (id) {
                    // 🎯 CORRECCIÓN DE RUTA 1: Añadido '/inventario'
                    const movResponse = await apiClient.get(`/inventario/movimientos/${id}`); 
                    const originalData = movResponse.data;
                    
                    setFormData({
                        claveCB: originalData.claveCB,
                        laboratorio: originalData.datosEntrada?.laboratorio || '',
                        costoUnitario: originalData.datosEntrada?.costoUnitario || 0,
                        totalEnzimas: originalData.datosEntrada?.totalEnzimas || 0,
                        pedido: originalData.datosEntrada?.pedido || '',
                        factura: originalData.datosEntrada?.factura || '',
                        proveedor: originalData.datosEntrada?.proveedor || '',
                        lote: originalData.datosEntrada?.lote || '',
                        // Asegura que la fecha esté en formato 'YYYY-MM-DD'
                        caducidad: originalData.datosEntrada?.caducidad ? 
                                new Date(originalData.datosEntrada.caducidad).toISOString().split('T')[0] : '',
                        responsable: originalData.responsable || '',
                    });
                    setIsEditing(true);
                }

            } catch (error) {
                console.error("Error al cargar datos originales:", error);
                setMensaje('❌ Error al cargar los datos originales para edición.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]); 

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
            // 🎯 CORRECCIÓN DE RUTA 2: Añadido '/inventario' y ruta completa para PUT
            const response = await apiClient.put(`/inventario/movimientos/entrada/${id}`, formData); 
            setMensaje(`✅ Éxito: ${response.data.message}`);
            
            setTimeout(() => {
                navigate('/reporte-historial'); 
            }, 2000); 

        } catch (error) {
            const msg = error.response?.data?.message || 'Error desconocido al modificar la entrada.';
            setMensaje(`❌ Error: ${msg}`);
            console.error('Error de API:', error.response || error);
        }
    };
    
    const medicamentoSeleccionado = medicamentos.find(m => m.claveCB === formData.claveCB);
    const costoUnitarioNum = parseFloat(formData.costoUnitario) || 0;
    const totalEnzimasNum = parseFloat(formData.totalEnzimas) || 0;
    const costoTotalCalculado = costoUnitarioNum * totalEnzimasNum;
    
    if (loading) return <h1>Cargando datos de modificación...</h1>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>MODIFICAR Entrada de Medicamentos (ID: {id})</h1>
            {mensaje && <p style={{ padding: '10px', backgroundColor: mensaje.startsWith('✅') ? '#d4edda' : '#f8d7da', border: '1px solid', marginBottom: '20px' }}>{mensaje}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* COLUMNA 1 */}
                <div>
                    <h2>Datos de Identificación</h2>
                    <label>Clave de CB:</label>
                    <select name="claveCB" value={formData.claveCB} onChange={handleChange} required disabled={isEditing}>
                        <option value="">Seleccione el medicamento</option>
                        {medicamentos.map(med => (
                            <option key={med.claveCB} value={med.claveCB}>{med.claveCB} - {med.descripcion}</option>
                        ))}
                    </select>

                    {medicamentoSeleccionado && (
                        <>
                            <p>Descripción: <strong>{medicamentoSeleccionado.descripcion}</strong></p>
                            <p>Presentación: <strong>{medicamentoSeleccionado.presentacion}</strong></p>
                        </>
                    )}

                    <label>Proveedor:</label><input type="text" name="proveedor" value={formData.proveedor} onChange={handleChange} required />
                    <label>Factura:</label><input type="text" name="factura" value={formData.factura} onChange={handleChange} required />
                    <label>Pedido:</label><input type="text" name="pedido" value={formData.pedido} onChange={handleChange} required />
                    <label>Laboratorio:</label><input type="text" name="laboratorio" value={formData.laboratorio} onChange={handleChange} required />
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
                    
                    <p style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', fontWeight: 'bold', borderLeft: '4px solid #ffc107' }}>
                        Costo Total Modificado: ${costoTotalCalculado.toFixed(2)}
                    </p>
                                        
                    <label>Responsable del Movimiento:</label>
                    <select name="responsable" value={formData.responsable} onChange={handleChange} required>
                        <option value="">Seleccione el responsable</option>
                        {personal.map((p, index) => (
                            <option key={p._id || index} value={p.nombre}>{p.nombre} ({p.cargo})</option>
                        ))}
                    </select>

                    <button type="submit" style={{ marginTop: '30px', padding: '10px 20px', backgroundColor: '#ffc107', color: 'black', border: 'none', cursor: 'pointer' }}>
                        Guardar Modificación
                    </button>
                    <button type="button" onClick={() => navigate('/informes')} style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', marginLeft: '10px' }}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormularioModificarEntrada;