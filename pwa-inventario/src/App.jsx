// src/App.jsx
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import InventarioGlobal from './pages/InventarioGlobal'; 
import FormularioEntrada from './pages/FormularioEntrada';
import FormularioSalida from './pages/FormularioSalida';
import ReporteCaducidades from './pages/ReporteCaducidades'; 
import ReporteHistorial from './pages/ReporteHistorial';       

// 🎯 NUEVA IMPORTACIÓN
import FormularioModificarEntrada from './pages/ModificarMovimiento'; 

// Este es un componente de navegación simple para ver las rutas
const NavBar = () => (
  <nav style={{ padding: '10px', backgroundColor: '#343a40', display: 'flex', gap: '20px' }}>
    <NavLink to="/" style={{ margin: '0 10px', color: 'white', textDecoration: 'none' }}>Inventario Global</NavLink>
    <NavLink to="/entrada" style={{ margin: '0 10px', color: 'white', textDecoration: 'none' }}>Nueva Entrada</NavLink>
    <NavLink to="/salida" style={{ margin: '0 10px', color: 'white', textDecoration: 'none' }}>Nueva Salida</NavLink>
    <NavLink to="/caducidades" style={{ margin: '0 10px', color: 'white', textDecoration: 'none' }}>Alerta Caducidades 🚦</NavLink>
    <NavLink to="/informes" style={{ margin: '0 10px', color: 'white', textDecoration: 'none' }}>Movimientos / PDF</NavLink>
    {/* Se elimina el NavLink a /modificar ya que la navegación es dinámica desde /informes */}
</nav>
);

function App() {
  return (
    <BrowserRouter>
        <header>
          <h2 style={{ padding: '10px 20px', margin: 0 }}>Gestión de Farmacia - Hospital Acámbaro</h2>
          <NavBar />
        </header>
        <div style={{ padding: '20px' }}>
          <Routes>
            {/* RUTA PRINCIPAL (Requisito 2.1) */}
            <Route path="/" element={<InventarioGlobal />} /> 
            {/* MOVIMIENTOS (Requisitos 2.2 y 2.3) */}
          <Route path="/entrada" element={<FormularioEntrada />} />
          <Route path="/salida" element={<FormularioSalida />} />
            {/* REPORTES (Requisito 2.5) */}
          <Route path="/caducidades" element={<ReporteCaducidades />} />
            {/* INFORMES/TRAZABILIDAD (Requisitos 2.4 y 2.6) */}
          <Route path="/informes" element={<ReporteHistorial />} />
          <Route path="/movimientos/modificar/:id" element={<FormularioModificarEntrada />} />
          </Routes>
        </div>
    </BrowserRouter>
);
}

export default App;