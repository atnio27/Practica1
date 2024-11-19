const express = require("express");

const Patient = require("../models/patient.js");
const router = express.Router();
const { authorize } = require("../auth/auth.js");
const User = require("../models/users.js");
const bcrypt = require("bcrypt");

// Obtener un listado de todos los pacientes
router.get("/", authorize(["admin", "physio"]), async (req, res) => {
    try {
        const patients = await Patient.find();

        if (patients.length === 0) {
            return res.status(404).json({
                error: "Patients not found",
                result: null,
            });
        }

        res.status(200).json({
            error: null,
            result: patients,
        });
    } catch (error) {
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Buscar pacientes por nombre o apellidos
router.get("/find", authorize(["admin", "physio"]), async (req, res) => {
    const surname = req.query.surname;
    try {
        let patients;

        // Control si hay apellido o no
        if (surname) {
            patients = await Patient.find({
                surname: {
                    $regex: surname,
                    $options: "i",
                },
            });
        } else {
            patients = await Patient.find();
        }

        // Si no se han encontrado pacientes
        if (patients.length === 0) {
            return res.status(404).json({
                error: "There are no patients with that surname",
                result: null,
            });
        }

        // Si todo ha ido bien
        res.status(200).json({
            error: null,
            result: patients,
        });
    } catch (error) {
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Obtener detalles de un paciente específico por ID
router.get(
    "/:id",
    authorize(["admin", "physio", "patient"]),
    async (req, res) => {
        const patientId = req.params.id;

        try {
            const patient = await Patient.findById(patientId);

            // Si no hay paciente con ese id
            if (!patient) {
                return res.status(404).json({
                    error: "Patient not found",
                    result: null,
                });
            }

            const rol = req.user.rol;
            const id = req.user.id;

            if (rol === "patient" && id !== patientId) {
                return res.status(403).json({
                    error: "Unauthorised access",
                    result: null,
                });
            }

            res.status(200).json({
                error: null,
                result: patient,
            });
        } catch (error) {
            res.status(500).json({
                error: "Internal server error: " + error.message,
                result: null,
            });
        }
    }
);

// Insertar un paciente
router.post("/", authorize(["admin", "physio"]), async (req, res) => {
    const newUser = new User({
        login: req.body.login,
        password: await bcrypt.hash(req.body.password, 10),
        rol: "patient",
    });

    newUser.save();

    const patientInfo = req.body;

    try {
        const newPatient = new Patient({
            _id: newUser._id,
            ...patientInfo,
        });

        const savedPatient = await newPatient.save();

        // Si todo va bien
        res.status(201).json({
            error: null,
            result: savedPatient,
        });
    } catch (error) {
        res.status(400).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Actualizar los datos de un paciente
router.put("/:id", authorize(["admin", "physio"]), async (req, res) => {
    const id = req.params.id;

    const patientInfo = req.body;

    try {
        const updatedPatient = await Patient.findByIdAndUpdate(id, {
            ...patientInfo,
        });

        // Si el paciente no se ha encontrado
        if (!updatedPatient) {
            return res.status(400).json({
                error: "Patient not found",
                result: null,
            });
        }

        // Si todo va bien
        res.status(200).json({
            error: null,
            result: updatedPatient,
        });
    } catch (error) {
        // Error en el servidor
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Eliminar un paciente
router.delete("/:id", authorize(["admin", "physio"]), async (req, res) => {
    const id = req.params.id;

    try {
        const deletedPatient = await Patient.findByIdAndDelete(id);

        // Si el paciente no se ha encontrado
        if (!deletedPatient) {
            return res.status(404).json({
                error: "Patient not found",
                result: null,
            });
        }

        // Si todo va bien
        res.status(200).json({
            error: null,
            result: deletedPatient,
        });
    } catch (error) {
        // Error en el servidor
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

module.exports = router;
