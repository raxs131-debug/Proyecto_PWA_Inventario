import mongoose from 'mongoose';

const PersonalSchema = new mongoose.Schema({
    // Usamos 'idPersonal' o 'clave' si es un ID de sistema del hospital, 
    // pero 'nombre' o 'id' como referencia simple está bien para este proyecto.
    id: { type: String, required: true, unique: true }, 
    nombre: { type: String, required: true },
    cargo: { type: String, required: true }
});

export default mongoose.model('Personal', PersonalSchema);