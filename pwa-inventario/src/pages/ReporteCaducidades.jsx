import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const ReporteCaducidades = () => {
    const [reporte, setReporte] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReporte = async () => {
            try {
                const response = await apiClient.get('/inventario/reporte/caducidades');
                setReporte(response.data);
            } catch (err) {
                console.error("Error al cargar el reporte de caducidades:", err);
                // Actualizamos el mensaje de error con la ruta correcta para referencia
                setError('Error al cargar el reporte. Asegúrate que el servidor esté corriendo y la ruta sea /inventario/reporte/caducidades.');
            } finally {
                setLoading(false);
            }
        };
        fetchReporte();
    }, []);

    const getRowColor = (semaforo) => {
        switch (semaforo) {
            case 'Rojo':
                return 'rgba(255, 1, 1, 0.58)'; // Rojo para alerta crítica
            case 'Amarillo':
                return 'rgba(255, 255, 0, 0.5)'; // Amarillo para precaución
            case 'Verde':
            default:
                return 'rgba(98, 255, 0, 1)'; // Verde para sin riesgo
        }
    };

    if (loading) return <h1>Generando Reporte de Caducidades...</h1>;
    if (error) return <h1 style={{ color: 'red' }}>{error}</h1>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Reporte de Caducidades por Lote (Semáforo)</h1>
            <p>Este reporte identifica los lotes según su proximidad a la fecha de caducidad:</p>
            <ul style={{ listStyleType: 'disc', margin: '10px 0 20px 20px' }}>
                <li style={{ color: 'red' }}>ROJO: Lotes con caducidad en 30 días o menos (Alerta Crítica).</li>
                <li style={{ color: '#ffc107' }}>AMARILLO: Lotes con caducidad entre 31 y 90 días (Precaución).</li>
                <li style={{ color: 'green' }}>VERDE: Lotes con caducidad en más de 90 días (Existencia Segura).</li>
            </ul>
            
            {reporte.length === 0 ? (
                <p style={{ marginTop: '20px', fontWeight: 'bold' }}>No hay existencias con stock para generar el reporte de caducidades.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#dc3545', color: 'white' }}> 
                            <th style={{ padding: '10px', border: '1px solid #ddd', color: 'white' }}>Clave CB</th> 
                            <th style={{ padding: '10px', border: '1px solid #ddd', color: 'white' }}>Descripción</th> 
                            <th style={{ padding: '10px', border: '1px solid #ddd', color: 'white' }}>Lote</th> 
                            <th style={{ padding: '10px', border: '1px solid #ddd', color: 'white' }}>Fecha Caducidad</th> 
                            <th style={{ padding: '10px', border: '1px solid #ddd', color: 'white' }}>Existencia Actual</th> 
                            <th style={{ padding: '10px', border: '1px solid #ddd', color: 'white' }}>Días Restantes</th> 
                            <th style={{ padding: '10px', border: '1px solid #ddd', color: 'white' }}>Alerta</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {reporte.map((item, index) => (
                            <tr 
                                key={item._id || index} 
                                style={{ backgroundColor: getRowColor(item.semaforo), color: 'black' }}
                            >
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.claveCB}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    {item.descripcion || 'N/A'}
                                </td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.lote}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(item.caducidad).toLocaleDateString('es-MX')}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>{item.stock}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>{item.diasParaVencer}</td>
                                <td style={{ 
                                    padding: '10px', 
                                    border: '1px solid #ddd', 
                                    fontWeight: 'bold',
                                    color: item.semaforo === 'Rojo' ? 'red' : item.semaforo === 'Amarillo' ? '#ffc107' : 'green'
                                }}>
                                    {item.semaforo}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ReporteCaducidades;