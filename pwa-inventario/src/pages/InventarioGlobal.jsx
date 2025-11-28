import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/apiClient'; 

const InventarioGlobal = () => {
    // 1. Estado para almacenar el inventario completo
    const [inventario, setInventario] = useState([]);
    // 2. Estado para el término de búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar el inventario una sola vez al inicio
    useEffect(() => {
        const fetchInventario = async () => {
            try {
                const response = await apiClient.get('/inventario'); 
                setInventario(response.data);
            } catch (err) {
                console.error("Error al cargar el inventario global:", err);
                setError('Error al cargar el inventario. Asegúrate que la API está corriendo y hay datos.');
            } finally {
                setLoading(false);
            }
        };
        fetchInventario();
    }, []);

    const filteredInventario = useMemo(() => {
        // Si no hay término de búsqueda, retorna el inventario completo
        if (!searchTerm) {
            return inventario;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return inventario.filter(item => {
            // Filtra si la Clave CB o la Descripción incluye el término de búsqueda
            const claveMatch = item.claveCB.toLowerCase().includes(lowerCaseSearchTerm);
            const descMatch = item.descripcion.toLowerCase().includes(lowerCaseSearchTerm);
            
            return claveMatch || descMatch;
        });
    }, [inventario, searchTerm]); 


    if (loading) return <h1 style={{ padding: '20px' }}>Cargando Inventario Global...</h1>;
    if (error) return <h1 style={{ color: '#8B0000', backgroundColor: '#FFCCCC', padding: '15px', borderRadius: '5px' }}>{error}</h1>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Inventario Global de Enzimas</h1>
            
            {/* --- CAJA DE BÚSQUEDA --- */}
            <div role="search" style={{ marginBottom: '20px' }}>
                <label htmlFor="search" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Buscar medicamento por Clave o Descripción:
                </label>
                <input
                    type="text"
                    id="search"
                    placeholder="Escribe aquí para filtrar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                        width: '300px', 
                        padding: '10px 15px', 
                        fontSize: '16px', 
                        border: '1px solid #007bff', 
                        borderRadius: '6px'
                    }}
                />
            </div>
            {/* ------------------------- */}


            <p>
                Total de productos únicos: <strong style={{color: '#007bff'}}>{inventario.length}</strong> (Mostrando: <strong style={{color: '#007bff'}}>{filteredInventario.length}</strong> coincidencias)
            </p>

            {filteredInventario.length === 0 && searchTerm ? (
                <p role="alert" style={{ color: '#dc3545', fontWeight: 'bold', borderLeft: '4px solid #dc3545', padding: '10px', backgroundColor: '#fef3f4' }}>
                    No se encontraron resultados para la búsqueda "{searchTerm}".
                </p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ minWidth: '700px', width: '100%', borderCollapse: 'collapse', marginTop: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <caption style={{ textAlign: 'left', margin: '10px 0', fontSize: '1.2em', fontWeight: '600' }}>
                            Listado Detallado del Inventario Global de Enzimas
                        </caption>
                        <thead>
                            <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                                <th scope="col" style={{ padding: '12px', border: '1px solid #0056b3' }}>Clave CB</th>
                                <th scope="col" style={{ padding: '12px', border: '1px solid #0056b3' }}>Descripción</th>
                                <th scope="col" style={{ padding: '12px', border: '1px solid #0056b3' }}>Presentación</th>
                                <th scope="col" style={{ padding: '12px', border: '1px solid #0056b3' }}>Total Enzimas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventario.map((item, index) => (
                                <tr 
                                    key={item.claveCB} 
                                    style={{ 
                                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white', 
                                        transition: 'background-color 0.15s' 
                                    }}
                                >
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.claveCB}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.descripcion}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{item.presentacion}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>{item.totalEnzimas}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InventarioGlobal;
