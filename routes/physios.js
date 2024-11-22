const express = require("express");
const router = express.Router();

const Physio = require("../models/physio.js");
const { authorize } = require("../auth/auth.js");
const { createUser } = require("../utils/createUser.js");

// Obtener un listado de todos los fisios
router.get("/", authorize(["admin", "physio", "patient"]), async (req, res) => {
    try {
        const physios = await Physio.find();

        // Si no hay fisios
        if (physios.length === 0) {
            return res.status(404).json({
                error: "Physios not found",
                result: null,
            });
        }

        // Si todo va bien
        res.status(200).json({
            error: null,
            result: physios,
        });
    } catch (error) {
        // Error en el servidor
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Buscar fisios por especialidad
router.get(
    "/find",
    authorize(["admin", "physio", "patient"]),
    async (req, res) => {
        const { specialty } = req.query;

        try {
            let physios;

            // Control si hay especialidad o no
            if (specialty) {
                physios = await Physio.find({
                    specialty: {
                        $regex: specialty,
                        $options: "i",
                    },
                });
            } else {
                physios = await Physio.find();
            }

            // Si no hay fisios con esa especialidad
            if (physios.length === 0) {
                return res.status(404).json({
                    error: "Physios not found with that specialty",
                    result: null,
                });
            }

            // Si todo fue bien
            res.status(200).json({
                error: null,
                result: physios,
            });
        } catch (error) {
            // Error en el servidor
            res.status(500).json({
                error: "Internal server error: " + error.message,
                result: null,
            });
        }
    }
);

// Obtener detalles de un fisioterapeuta específico
router.get(
    "/:id",
    authorize(["admin", "physio", "patient"]),
    async (req, res) => {
        const physioId = req.params.id;

        try {
            const physio = await Physio.findById(physioId);

            // Si no hay fisio con ese id
            if (!physio) {
                return res.status(404).json({
                    error: "Physio not found",
                    result: null,
                });
            }

            // Si todo va bien
            res.status(200).json({
                error: null,
                result: physio,
            });
        } catch (error) {
            // Error en el servidor
            res.status(500).json({
                error: "Internal server error: " + error.message,
                result: null,
            });
        }
    }
);

// Insertar un fisio
router.post("/", authorize(["admin"]), async (req, res) => {
    const { login, password, rol } = {
        login: req.body.login,
        password: req.body.password,
        rol: "physio",
    };

    const newUser = createUser(login, password, rol);

    const physioInfo = req.body;

    try {
        const newPhysio = new Physio({
            _id: newUser._id,
            ...physioInfo,
        });

        const savedPhysio = await newPhysio.save();

        // Si todo va bien
        res.status(201).json({
            error: null,
            result: savedPhysio,
        });
    } catch (error) {
        // Error en el servidor
        res.status(400).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Actualizar un fisio
router.put("/:id", authorize(["admin"]), async (req, res) => {
    const id = req.params.id;

    const physioInfo = req.body;

    try {
        const updatedPhysio = await Physio.findByIdAndUpdate(id, {
            ...physioInfo,
            new: true,
            runValidators: true,
        });

        // Si no hay fisio con ese id
        if (!updatedPhysio) {
            return res.status(400).json({
                error: "Physio not found",
                result: null,
            });
        }

        // Si todo va bien
        res.status(200).json({
            error: null,
            result: updatedPhysio,
        });
    } catch (error) {
        // Error en el servidor
        res.status(500).json({
            error: "Internal server error: " + error.message,
            result: null,
        });
    }
});

// Eliminar un fisio
router.delete("/:id", authorize(["admin"]), async (req, res) => {
    const id = req.params.id;

    try {
        const deletedPhysio = await Physio.findByIdAndDelete(id);

        // Si no hay fisio con ese id
        if (!deletedPhysio) {
            return res.status(404).json({
                error: "Physio not found",
                result: null,
            });
        }

        // Si todo va bien
        res.status(200).json({
            error: null,
            result: deletedPhysio,
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
