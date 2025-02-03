const express = require("express");

const upload = require(__dirname + "/../utils/uploads.js");
const router = express.Router();
const Patient = require("../models/patient");
const Record = require("../models/record");

// .get
router.get("/new", (req, res) => {
    res.render("patients/patient_add");
});

router.get("/:id/edit", async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (patient) {
            res.render("patients/patient_edit", { patient });
        } else {
            res.render("error", { error: "Patient not found" });
        }
    } catch (error) {
        res.render("error", { error: "Patient not found" });
    }
});

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

router.get("/", async (req, res) => {
    const { name, surname } = req.query;

    try {
        const query = {};
        if (name || surname) {
            const conditions = [];
            if (name)
                conditions.push({
                    name: { $regex: name.trim(), $options: "i" },
                });
            if (surname)
                conditions.push({
                    surname: { $regex: surname.trim(), $options: "i" },
                });
            if (conditions.length > 0) query.$and = conditions;
        }

        let patients = await Patient.find(query);

        if (patients.length === 0) {
            return res.status(404).render("error", {
                title: "Patients Not Found",
                error: "No patients found with those criteria.",
                code: 404,
            });
        }

        patients = await Promise.all(
            patients.map(async (patient) => ({
                ...patient.toObject(),
                hasRecord: await hasRecord(patient._id),
            }))
        );

        res.render("patients/patients_list", {
            title: "Patients List",
            patients,
            filter: { name, surname },
        });
    } catch (error) {
        res.status(500).render("error", {
            title: "Error",
            error: "An error occurred while fetching patients.",
            code: 500,
        });
    }
});

// .post
// edit
router.post("/:id", upload.upload.single("image"), async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (patient) {
            patient.name = req.body.name;
            patient.surname = req.body.surname;
            patient.birthDate = req.body.birthDate;
            patient.address = req.body.address;
            patient.insuranceNumber = req.body.insuranceNumber;
            if (req.file) patient.image = req.file.filename;

            await patient.save();
            res.redirect(req.baseUrl);
        } else {
            res.render("error", { error: "Patient not found" });
        }
    } catch (error) {
        let errors = {
            general: "Error editing patient",
        };
        if (error.errors) {
            if (error.errors.name) {
                errors.name = error.errors.name.message;
            }
            if (error.errors.surname) {
                errors.surname = error.errors.surname.message;
            }
            if (error.errors.birthDate) {
                errors.birthDate = error.errors.birthDate.message;
            }
            if (error.errors.address) {
                errors.address = error.errors.address.message;
            }
            if (error.errors.insuranceNumber) {
                errors.insuranceNumber = error.errors.insuranceNumber.message;
            }
        }

        res.render("patients/patient_edit", {
            errors: errors,
            patient: {
                _id: req.params.id,
                name: req.body.name,
                surname: req.body.surname,
                birthDate: req.body.birthDate,
                address: req.body.address,
                insuranceNumber: req.body.insuranceNumber,
                image: req.file ? req.file.filename : patient.image,
            },
        });
    }
});

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
            image = req.file.filename;
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

// .delete
router.delete("/:id", async (req, res) => {
    try {
        await Patient.findByIdAndDelete(req.params.id);
        res.redirect(req.baseUrl);
    } catch (error) {
        res.render("error", { error: "Error deleting" });
    }
});

const hasRecord = async (patientId) => {
    const record = await Record.findOne({ patient: patientId });
    return !!record;
};

module.exports = router;
