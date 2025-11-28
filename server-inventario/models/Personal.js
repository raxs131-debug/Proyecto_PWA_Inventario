import mongoose from 'mongoose';

const PersonalSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, 
    nombre: { type: String, required: true },
    cargo: { type: String, required: true }
});

export default mongoose.model('Personal', PersonalSchema);