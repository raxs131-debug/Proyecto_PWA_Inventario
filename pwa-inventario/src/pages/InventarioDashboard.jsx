import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const InventarioDashboard = () => {
const [inventario, setInventario] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
    // Función para cargar los datos del inventario
    const fetchInventario = async () => {
    try {
        setLoading(true);
        // Llama al endpoint que creamos en Node.js
        const response = await apiClient.get('/inventario'); 
        setInventario(response.data);
    } catch (err) {
        console.error("Error al cargar el inventario:", err);
        setError('No se pudo cargar el inventario. Asegúrate que el backend de Node.js esté funcionando en http://localhost:3001.');
    } finally {
        setLoading(false);
    }
    };

    fetchInventario();
}, []);

if (loading) return <p>Cargando inventario...</p>;
if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

return (
    <div>
    <h1>Inventario General de Medicamentos</h1>
        <p>Total de medicamentos únicos: {inventario.length}</p>
    
    <table>
        <thead>
        <tr>
            <th>Clave de CB</th>
            <th>Descripción</th>
            <th>Presentación</th>
            <th>TOTAL DE ENZIMAS</th>
        </tr>
        </thead>
        <tbody>
        {inventario.map((med) => (
            <tr key={med.claveCB}>
            <td>{med.claveCB}</td>
            <td>{med.descripcion}</td>
            <td>{med.presentacion}</td>
              {/* TOTAL DE ENZIMAS viene ya calculado desde el backend */}
            <td><strong>{med.totalEnzimas.toLocaleString()}</strong></td> 
            </tr>
        ))}
        </tbody>
    </table>

    {inventario.length === 0 && (
        <p>No hay datos en el inventario. Asegúrate de registrar una Entrada.</p>
    )}

    </div>
);
};

export default InventarioDashboard;