import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import inventarioRoutes from './routes/inventario.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/farmaciaDB'; 

// --- Middlewares ---
// Habilitar CORS para permitir solicitudes desde el frontend de React
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'] // Asegúrate de que este es el puerto de tu React
}));
// Permite al servidor procesar JSON en el cuerpo de las peticiones
app.use(express.json());

// --- Conexión a MongoDB ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

// --- Rutas ---
app.get('/', (req, res) => {
    res.send('API de Inventario de Farmacia Activa!');
});

// Usar las rutas de inventario (Todas inician con /api)
app.use('/api/inventario', inventarioRoutes); 

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`URL de la API: http://localhost:${PORT}`);
});
