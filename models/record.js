const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    physio: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Physio",
        required: true,
    },
    diagnosis: {
        type: String,
        required: true,
        minlenght: 10,
        maxlenght: 500,
    },
    treatment: {
        type: String,
        required: true,
    },
    observations: {
        type: String,
        maxlenght: 500,
    },
});

const recordSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
        unique: true,
    },
    medicalRecord: {
        type: String,
        maxlenght: 1000,
    },
    appointments: [appointmentSchema],
});

// Crear el modelo y exportarlo
const Record = mongoose.model("Records", recordSchema);
module.exports = Record;
