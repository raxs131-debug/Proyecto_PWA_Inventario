import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import apiClient from '../api/apiClient';
import { API_BASE_URL } from '../api/apiClient'; 

const ReporteHistorial = () => {
    const navigate = useNavigate(); 
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [filtros, setFiltros] = useState({
        tipo: '',      
        fechaInicio: '',
        fechaFin: ''
    });

    const buildQueryString = (params) => {
        const query = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key]) {
                query.append(key, params[key]);
            }
        });
        return query.toString();
    };

    const fetchHistorial = async (currentFiltros) => {
        setLoading(true);
        setError(null);
        try {
            const queryString = buildQueryString(currentFiltros);
            const url = `/inventario/reportes/historial?${queryString}`; 

            const response = await apiClient.get(url); 
            setHistorial(response.data);
        } catch (err) {
            console.error("Error al cargar el historial de movimientos:", err);
            setError('Error al cargar el historial. Asegúrate que el servidor esté corriendo y los endpoints sean correctos.');
        } finally {
            setLoading(false);
        }
    };

    // useEffect para cargar el historial inicial y al cambiar los filtros
    useEffect(() => {
        fetchHistorial(filtros);
    }, [filtros]); 

    // Manejador para los inputs de filtro
    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    // Función para manejar la descarga de PDF con los filtros
    const handlePDFDownload = () => {
        const queryString = buildQueryString(filtros);
        const url = `${API_BASE_URL}/inventario/reportes/historial/pdf?${queryString}`; 
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Función para navegar al formulario de modificación
    const handleModificar = (id) => {
        navigate(`/movimientos/modificar/${id}`); 
    };

    // Función para obtener los detalles de la salida/entrada
    const getDetallesString = (detalles) => {
        if (detalles.lotesAfectados) { 
             // Si tiene lotesAfectados, es una Salida
            return `Cantidad: ${detalles.cantidad}, Motivo: ${detalles.motivo}, Lotes: ${detalles.lotesAfectados}`;
        } else { 
            // Si tiene lote y caducidad, es una Entrada
            return `Lote: ${detalles.lotesAfectados || 'N/A'}, Cantidad: ${detalles.cantidad}, Caducidad: ${detalles.caducidad}`;
        }
    };


    if (loading) return <h1>Cargando Historial de Movimientos...</h1>;
    if (error) return <h1 style={{ color: 'red' }}>{error}</h1>;
    
    return (
        <div style={{ padding: '20px' }}>
            <h2>Historial de Movimientos</h2>
            <p>Filtra los movimientos y usa el botón para modificar Entradas y Salidas.</p>
            
            {/* --- CONTROLES DE FILTROS --- */}
            <div style={{ 
                display: 'flex', gap: '20px', marginBottom: '20px', padding: '15px',
                border: '1px solid #ccc', borderRadius: '8px'
            }}>
                <label>
                    Tipo:
                    <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
                        <option value="">Todos</option>
                        <option value="Entrada">Entrada</option>
                        <option value="Salida">Salida</option>
                    </select>
                </label>
                <label>
                    Fecha Inicio:
                    <input type="date" name="fechaInicio" value={filtros.fechaInicio} onChange={handleFiltroChange} />
                </label>
                <label>
                    Fecha Fin:
                    <input type="date" name="fechaFin" value={filtros.fechaFin} onChange={handleFiltroChange} />
                </label>
                <button 
                    onClick={handlePDFDownload} 
                    style={{ 
                        padding: '10px 20px', backgroundColor: '#007bff', color: 'white', 
                        border: 'none', borderRadius: '5px'
                    }}
                >
                    ⬇️ Descargar PDF
                </button>
            </div>

            {/* --- TABLA DE HISTORIAL --- */}
            {historial.length === 0 ? (
                <p style={{marginTop: '20px', fontWeight: 'bold'}}>No se encontraron movimientos para los filtros seleccionados. Asegúrate de tener entradas registradas.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#343a40', color: 'white' }}>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tipo</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Fecha</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Clave CB</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Descripción</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Responsable</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Detalles del Movimiento</th>
                            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Acción</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {historial.map((mov, index) => (
                            <tr key={mov._id} style={{ 
                                backgroundColor: mov.tipoMovimiento === 'Entrada' ? '#d4edda' : '#f8d7da' 
                            }}>
                                <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>{mov.tipoMovimiento}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(mov.fecha).toLocaleDateString('es-MX')}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{mov.claveCB}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{mov.descripcion}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{mov.responsable}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px' }}>{getDetallesString(mov.detalles)}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                    {['Entrada', 'Salida'].includes(mov.tipoMovimiento) && (
                                        <button 
                                            onClick={() => handleModificar(mov._id)}
                                            style={{ 
                                                padding: '5px 10px', backgroundColor: '#ffc107', color: 'black', 
                                                border: 'none', borderRadius: '3px', cursor: 'pointer'
                                            }}
                                        >
                                            ✏️ Modificar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ReporteHistorial;