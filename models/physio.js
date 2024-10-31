const mongoose = require("mongoose");

// Definir el esquema del Fisio
const physioSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
    },
    surname: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
    },
    specialty: {
        type: String,
        required: true,
        enum: [
            "Sports",
            "Neurological",
            "Pediatric",
            "Geriatric",
            "Oncological",
        ],
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true,
        match: /^[a-zA-Z0-9]{8}$/,
    },
});

// Crear el modelo de Fisio
const Physio = mongoose.model("Physios", physioSchema);
module.exports = Physio;
