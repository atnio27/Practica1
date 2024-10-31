const express = require("express");
const router = express.Router();

const Record = require("../models/record.js");
const Patient = require("../models/patient.js");

// Listado de todos los expedietes
router.get("/", async (req, res) => {
    try {
        const records = await Record.find();

        // Si no hay expedientes
        if (records.length === 0) {
            return res.status(404).json({
                error: "records not found",
                result: null,
            });
        }

        // Si todo fue bien
        res.status(200).json({
            error: null,
            result: records,
        });
    } catch (error) {
        // Error en el servidor
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Buscar expedientes por apellido de pacientes
router.get("/find", async (req, res) => {
    const { surname } = req.query;

    try {
        let records;

        // Control apellido
        if (surname) {
            const patients = await Patient.find({
                surname: { $regex: surname, $options: "i" },
            });

            // Si no hay pacientes con ese apellido
            if (patients.length === 0) {
                return res.status(404).json({
                    error: "There are no patients with that surname",
                    result: null,
                });
            }

            const patientsIds = patients.map((p) => p._id);

            // Buscar expedientes por los IDs de pacientes
            records = await Record.find({
                patient: { $in: patientsIds },
            });

            // Si no hay expedientes con ese paciente
            if (records.length === 0) {
                return res.status(404).json({
                    error: "There are no records for that patient",
                    result: null,
                });
            }

            // Si todo ha ido bien
            return res.status(200).json({
                error: null,
                result: records,
            });
        }

        // Si todo ha ido bien y no hay apellido
        records = await Record.find();

        res.status(200).json({
            error: null,
            result: records,
        });
    } catch (error) {
        // Error en el servidor
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Obtener detalles de un expediente específico
router.get("/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const record = await Record.findById(id);

        // Si no hay expediente con ese id
        if (!record) {
            return res.status(404).json({
                error: "Record not found",
                result: null,
            });
        }

        // Si todo va bien
        res.status(200).json({
            error: null,
            result: record,
        });
    } catch (error) {
        // Error en el servidor
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Insertar un expediente
router.post("/", async (req, res) => {
    const recordInfo = req.body;
    const patientId = req.params.id;

    // Si no existe el paciente
    if (!patientId) {
        return res.status(404).json({
            error: "Patient id not found",
            result: null,
        });
    }

    const newRecord = new Record({
        ...recordInfo,
    });

    try {
        const savedRecord = await newRecord.save();

        // Si todo va bien
        res.status(201).json({
            error: null,
            result: savedRecord,
        });
    } catch (error) {
        // Error en el servidor
        res.status(400).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Añadir consultas a un expediente
router.post("/:id/appointments", async (req, res) => {
    const recordId = req.params.id;
    const appointmentInfo = req.body;

    try {
        const record = await Record.findById(recordId);

        // Si no existe el expediente
        if (!record) {
            return res.status(404).json({
                error: "Record not found",
                result: null,
            });
        }

        // Añadir la consulta al expediente
        record.appointments.push(appointmentInfo);

        await record.save();

        res.status(201).json({
            error: null,
            result: record,
        });
    } catch (error) {
        // Error en el servidor
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Eliminar un expediente
router.delete("/:id", async (req, res) => {
    const recordId = req.params.id;

    try {
        const deletedRecord = await Record.findByIdAndDelete(recordId);

        // Si el paciente no existe
        if (!deletedRecord) {
            res.status(404).json({
                error: "Record not found",
                result: null,
            });
        } else {
            // Si todo va bien
            res.status(200).json({
                error: null,
                result: deletedRecord,
            });
        }
    } catch (error) {
        // Error en el servidor
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

module.exports = router;
