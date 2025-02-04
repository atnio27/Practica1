const express = require("express");
const router = express.Router();
const allowedRoles = require("../utils/auth.js");

const Record = require("../models/record.js");
const Physio = require("../models/physio.js");
const Patient = require("../models/patient.js");

// .get
router.get("/new", allowedRoles("admin", "physio"), async (req, res) => {
    const { patientId } = req.query;

    try {
        const patientsWithoutRecords = await Patient.aggregate([
            {
                $lookup: {
                    from: "records",
                    localField: "_id",
                    foreignField: "patient",
                    as: "record",
                },
            },
            {
                $match: {
                    record: { $size: 0 },
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    surname: 1,
                },
            },
        ]);

        res.render("records/record_add", {
            title: "Add Medical Record",
            patientId: patientId || null,
            patientsWithoutRecords,
        });
    } catch (error) {
        res.status(500).render("error", {
            title: "Error",
            error: "An error occurred while loading the form.",
            code: 500,
        });
    }
});

router.get(
    "/:id/appointments/new",
    allowedRoles("admin", "physio"),
    async (req, res) => {
        const { id } = req.params;

        try {
            const record = await Record.findOne({ patient: id }).populate(
                "patient"
            );

            if (!record) {
                return res.status(404).render("error", {
                    title: "Record Not Found",
                    error: `No record found with ID: ${id}`,
                    code: 404,
                });
            }

            const physios = await Physio.find();

            res.render("records/appointment_add", {
                title: "Add Appointment",
                record,
                physios,
            });
        } catch (error) {
            res.status(500).render("error", {
                title: "Error",
                error: "An error occurred while loading the appointment form.",
                code: 500,
            });
        }
    }
);

router.get(
    "/:id",
    allowedRoles("admin", "physio", "patient"),
    async (req, res) => {
        const { id } = req.params;

        // if (req.user.rol === "patient" && req.user.id !== id) {
        //     return res.status(403).render("error", {
        //         title: "Forbidden",
        //         error: "Forbidden: Insufficient role privileges.",
        //         code: 403,
        //     });
        // }

        try {
            const record = await Record.findOne({ patient: id })
                .populate("patient", "name surname")
                .populate("appointments.physio", "name");

            if (!record) {
                return res.status(404).render("error", {
                    title: "Record Not Found",
                    error: `No record found for patient with ID: ${id}`,
                    code: 404,
                });
            }

            res.render("records/record_detail", {
                title: `Record Details - ${record.patient.name} ${record.patient.surname}`,
                record,
            });
        } catch (error) {
            res.status(500).render("error", {
                title: "Error",
                error: "An error occurred while fetching the record details.",
                code: 500,
            });
        }
    }
);

router.get("/", allowedRoles("admin", "physio"), async (req, res) => {
    const { surname } = req.query;

    try {
        let query = {};
        if (surname) query.surname = surname;

        const records = await Record.find().populate({
            path: "patient",
            match: query,
            select: "name surname",
        });

        const filteredRecords = records.filter((record) => record.patient);

        if (filteredRecords.length === 0) {
            return res.status(404).render("error", {
                title: "Records Not Found",
                error: "No records found with those criteria.",
                code: 404,
            });
        }

        res.render("records/records_list", {
            title: "Records List",
            records: filteredRecords,
            filter: { surname },
        });
    } catch (error) {
        res.status(500).render("error", {
            title: "Error",
            error: "An error occurred while fetching the records.",
            code: 500,
        });
    }
});

// .post
router.post(
    "/:id/appointments",
    allowedRoles("admin", "physio"),
    async (req, res) => {
        const { id } = req.params;
        const { date, physio, diagnosis, treatment, observations } = req.body;

        const appointment = {
            date,
            physio,
            diagnosis,
            treatment,
            observations,
        };

        try {
            const record = await Record.findOne({ patient: id });
            if (!record) {
                return res.status(404).render("error", {
                    title: "Record Not Found",
                    error: `No record found with ID: ${id}`,
                    code: 404,
                });
            }

            record.appointments.push(appointment);

            await record.save();

            res.redirect(`/records/${record.patient._id}`);
        } catch (error) {
            const errors = {
                general: "An error occurred while adding the appointment.",
            };

            if (error.name === "ValidationError") {
                const physios = await Physio.find();
                const record = await Record.findOne({ patient: id }).populate(
                    "patient"
                );

                if (error.errors.date) errors.date = error.errors.date.message;
                if (error.errors.physio)
                    errors.physio = error.errors.physio.message;
                if (error.errors.diagnosis)
                    errors.diagnosis = error.errors.diagnosis.message;
                if (error.errors.treatment)
                    errors.treatment = error.errors.treatment.message;
                if (error.errors.observations)
                    errors.observations = error.errors.observations.message;

                return res.status(400).render("records/appointment_add", {
                    title: "Validation Error",
                    errors,
                    appointment,
                    record,
                    physios,
                });
            }

            res.status(500).render("error", {
                title: "Error",
                error: "An error occurred while adding the appointment.",
                code: 500,
            });
        }
    }
);

router.post("/", allowedRoles("admin", "physio"), async (req, res) => {
    const { patientId, medicalRecord } = req.body;

    if (!patientId) {
        return res.status(400).render("error", {
            title: "Invalid Request",
            error: "Patient ID is required to create a medical record.",
            code: 400,
        });
    }

    try {
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).render("error", {
                title: "Patient Not Found",
                error: `No patient found with ID: ${patientId}`,
                code: 404,
            });
        }

        const newRecord = new Record({
            patient: patient._id,
            medicalRecord,
            appointments: [],
        });

        await newRecord.save();

        res.status(200).redirect(`/records`);
    } catch (error) {
        const errors = {
            general: "An error occurred while creating the record.",
        };

        if (error.name === "ValidationError" || error.code === 11000) {
            if (error.errors.patient)
                errors.patient = error.errors.patient.message;
            if (error.errors.medicalRecord)
                errors.medicalRecord = error.errors.medicalRecord.message;

            if (error.code === 11000)
                errors.patient = "A record already exists for this patient.";

            res.status(400).render("records/record_add", {
                title: "Add Medical Record - Validation Error",
                errors,
                patientId,
                medicalRecord,
            });
        }

        res.status(500).render("error", {
            title: "Error",
            error: "An error occurred while adding the medical record.",
            code: 500,
        });
    }
});

module.exports = router;
