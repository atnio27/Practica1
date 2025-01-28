const express = require("express");

const upload = require(__dirname + "/../utils/uploads.js");
const router = express.Router();
const Patient = require("../models/patient");

// Listado general
router.get("/", async (req, res) => {
    try {
        const patients = await Patient.find();
        res.render("patients/patients_list", { patients });
    } catch (error) {
        res.render("error", { error: error });
    }
});

// Formulario de nuevo libro
router.get("/new", (req, res) => {
    res.render("patients/patient_add");
});

// Detalles
router.get("/:id", async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (patient) {
            res.render("patients/patient_detail", { patient });
        } else {
            res.render("error", { error: "Patient not found" });
        }
    } catch (error) {
        res.render("error", { error: error });
    }
});

// Delete
router.delete("/:id", async (req, res) => {
    try {
        await Patient.findByIdAndDelete(req.params.id);
        res.redirect(req.baseUrl);
    } catch (error) {
        res.render("error", { error: "Error deleting" });
    }
});

// Insert
router.post("/", upload.upload.single("image"), async (req, res) => {
    const {
        name,
        surname,
        birthDate,
        address,
        insuranceNumber,
        // login,
        // password,
    } = req.body;

    try {
        let image = null;
        if (req.file) {
            image = `/public/uploads/${req.file.filename}`;
        }

        const newPatient = new Patient({
            name,
            surname,
            birthDate,
            address,
            insuranceNumber,
            image,
        });

        const savedPatient = await newPatient.save();

        // const newUser = new User({
        //     _id: savedPatient._id,
        //     login: login,
        //     password: password,
        //     rol: ROLES.PATIENT,
        // });

        // await newUser.save();

        res.status(201).render("patients/patient_detail", {
            title: `Patient Added - ${savedPatient.name} ${savedPatient.surname}`,
            patient: savedPatient,
            message: "Patient successfully added!",
        });
    } catch (error) {
        if (req.file) {
            // deleteImage(req.file.filename);
        }

        const errors = {
            general: "An error occurred while creating the patient.",
        };

        if (error.name === "ValidationError" || error.code === 11000) {
            if (error.errors) {
                if (error.errors.name) errors.name = error.errors.name.message;
                if (error.errors.surname)
                    errors.surname = error.errors.surname.message;
                if (error.errors.birthDate)
                    errors.birthDate = error.errors.birthDate.message;
                if (error.errors.insuranceNumber)
                    errors.insuranceNumber =
                        error.errors.insuranceNumber.message;
                if (error.errors.address)
                    errors.address = error.errors.address.message;
                if (error.errors.login)
                    errors.login = error.errors.login.message;
                if (error.errors.password)
                    errors.password = error.errors.password.message;
            }

            if (error.code === 11000) {
                if (error.message.includes("insuranceNumber")) {
                    errors.insuranceNumber = "Insurance number must be unique.";
                }
                if (error.message.includes("login")) {
                    errors.login = "Login must be unique.";
                }
            }

            return res.render("patients/patient_add", {
                title: "Add Patient - Validation Error",
                patient: {
                    name,
                    surname,
                    birthDate,
                    address,
                    insuranceNumber,
                    // login,
                },
                errors,
            });
        }

        res.status(500).render("error", {
            title: "Internal Server Error",
            error: "An error occurred while adding the patient.",
            code: 500,
        });
    }
});

// Obtener un listado de todos los pacientes
// router.get("/", authorize(["admin", "physio"]), async (req, res) => {
//     try {
//         const patients = await Patient.find();

//         if (patients.length === 0) {
//             return res.status(404).json({
//                 error: "Patients not found",
//                 result: null,
//             });
//         }

//         res.status(200).json({
//             error: null,
//             result: patients,
//         });
//     } catch (error) {
//         res.status(500).json({
//             error: "Internal server error: " + error.message,
//             result: null,
//         });
//     }
// });

// // Buscar pacientes por nombre o apellidos
// router.get("/find", authorize(["admin", "physio"]), async (req, res) => {
//     const surname = req.query.surname;
//     try {
//         let patients;

//         // Control si hay apellido o no
//         if (surname) {
//             patients = await Patient.find({
//                 surname: {
//                     $regex: surname,
//                     $options: "i",
//                 },
//             });
//         } else {
//             patients = await Patient.find();
//         }

//         // Si no se han encontrado pacientes
//         if (patients.length === 0) {
//             return res.status(404).json({
//                 error: "There are no patients with that surname",
//                 result: null,
//             });
//         }

//         // Si todo ha ido bien
//         res.status(200).json({
//             error: null,
//             result: patients,
//         });
//     } catch (error) {
//         res.status(500).json({
//             error: "Internal server error: " + error.message,
//             result: null,
//         });
//     }
// });

// // Obtener detalles de un paciente específico por ID
// router.get(
//     "/:id",
//     authorize(["admin", "physio", "patient"]),
//     async (req, res) => {
//         const patientId = req.params.id;

//         try {
//             const patient = await Patient.findById(patientId);

//             // Si no hay paciente con ese id
//             if (!patient) {
//                 return res.status(404).json({
//                     error: "Patient not found",
//                     result: null,
//                 });
//             }

//             const rol = req.user.rol;
//             const id = req.user.id;

//             if (rol === "patient" && id !== patientId) {
//                 return res.status(403).json({
//                     error: "Unauthorised access",
//                     result: null,
//                 });
//             }

//             res.status(200).json({
//                 error: null,
//                 result: patient,
//             });
//         } catch (error) {
//             res.status(500).json({
//                 error: "Internal server error: " + error.message,
//                 result: null,
//             });
//         }
//     }
// );

// // Insertar un paciente
// router.post("/", authorize(["admin", "physio"]), async (req, res) => {
//     const { login, password, rol } = {
//         login: req.body.login,
//         password: req.body.password,
//         rol: "patient",
//     };

//     const newUser = createUser(login, password, rol);

//     const patientInfo = req.body;

//     try {
//         const newPatient = new Patient({
//             _id: newUser._id,
//             ...patientInfo,
//         });

//         const savedPatient = await newPatient.save();

//         // Si todo va bien
//         res.status(201).json({
//             error: null,
//             result: savedPatient,
//         });
//     } catch (error) {
//         res.status(400).json({
//             error: "Internal server error: " + error.message,
//             result: null,
//         });
//     }
// });

// // Actualizar los datos de un paciente
// router.put("/:id", authorize(["admin", "physio"]), async (req, res) => {
//     const id = req.params.id;

//     const patientInfo = req.body;

//     try {
//         const updatedPatient = await Patient.findByIdAndUpdate(id, {
//             ...patientInfo,
//         });

//         // Si el paciente no se ha encontrado
//         if (!updatedPatient) {
//             return res.status(400).json({
//                 error: "Patient not found",
//                 result: null,
//             });
//         }

//         // Si todo va bien
//         res.status(200).json({
//             error: null,
//             result: updatedPatient,
//         });
//     } catch (error) {
//         // Error en el servidor
//         res.status(500).json({
//             error: "Internal server error: " + error.message,
//             result: null,
//         });
//     }
// });

// // Eliminar un paciente
// router.delete("/:id", authorize(["admin", "physio"]), async (req, res) => {
//     const id = req.params.id;

//     try {
//         const deletedPatient = await Patient.findByIdAndDelete(id);

//         // Si el paciente no se ha encontrado
//         if (!deletedPatient) {
//             return res.status(404).json({
//                 error: "Patient not found",
//                 result: null,
//             });
//         }

//         // Si todo va bien
//         res.status(200).json({
//             error: null,
//             result: deletedPatient,
//         });
//     } catch (error) {
//         // Error en el servidor
//         res.status(500).json({
//             error: "Internal server error: " + error.message,
//             result: null,
//         });
//     }
// });

module.exports = router;
