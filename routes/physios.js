const path = require("path");
const fs = require("fs");
const allowedRoles = require("../utils/auth.js");

const express = require("express");

const upload = require(__dirname + "/../utils/uploads.js");

const router = express.Router();
const Physio = require("../models/physio");
const User = require("../models/users");

// .get
router.get("/new", allowedRoles("admin"), (req, res) => {
    res.render("physios/physio_add");
});

router.get("/:id/edit", allowedRoles("admin"), async (req, res) => {
    try {
        const physio = await Physio.findById(req.params.id);

        if (physio) {
            res.render("physios/physio_edit", { physio });
        } else {
            res.render("error", { error: "Physio not found" });
        }
    } catch (error) {
        res.render("error", { error: "Physio not found" });
    }
});

router.get(
    "/:id",
    allowedRoles("admin", "physio", "patient"),
    async (req, res) => {
        try {
            const physio = await Physio.findById(req.params.id);

            if (physio) {
                res.render("physios/physio_detail", { physio });
            } else {
                res.render("error", { error: "Physio not found" });
            }
        } catch (error) {
            res.render("error", { error: error });
        }
    }
);

router.get(
    "/",
    allowedRoles("admin", "physio", "patient"),
    async (req, res) => {
        const { specialty } = req.query;

        try {
            const query = {};
            if (specialty) query.specialty = specialty;

            const physios = await Physio.find(query);

            if (physios.length === 0) {
                return res.status(404).render("error", {
                    title: "Physios Not Found",
                    error: "No physios found with those criteria.",
                    code: 404,
                });
            }

            res.render("physios/physios_list", {
                title: "Physios List",
                physios,
                filter: { specialty },
            });
        } catch (error) {
            res.status(500).render("error", {
                title: "Error",
                error: "An error occurred while fetching physios.",
                code: 500,
            });
        }
    }
);

// .post
router.post(
    "/:id",
    allowedRoles("admin"),
    upload.upload.single("image"),
    async (req, res) => {
        try {
            const physio = await Physio.findById(req.params.id);
            if (physio) {
                physio.name = req.body.name;
                physio.surname = req.body.surname;
                physio.specialty = req.body.specialty;
                physio.licenseNumber = req.body.licenseNumber;
                if (req.file) physio.image = req.file.filename;

                await physio.save();
                res.redirect(req.baseUrl);
            } else {
                res.render("error", { error: "Physio not found" });
            }
        } catch (error) {
            let errors = {
                general: "Error editing physio",
            };
            if (error.errors) {
                if (error.errors.name) {
                    errors.name = error.errors.name.message;
                }
                if (error.errors.surname) {
                    errors.surname = error.errors.surname.message;
                }
                if (error.errors.specialty) {
                    errors.specialty = error.errors.specialty.message;
                }
                if (error.errors.licenseNumber) {
                    errors.licenseNumber = error.errors.licenseNumber.message;
                }
            }

            res.render("physios/physio_edit", {
                errors: errors,
                physio: {
                    _id: req.params.id,
                    name: req.body.name,
                    surname: req.body.surname,
                    specialty: req.body.specialty,
                    licenseNumber: req.body.licenseNumber,
                    image: req.file ? req.file.filename : physio.image,
                },
            });
        }
    }
);

router.post(
    "/",
    allowedRoles("admin"),
    upload.upload.single("image"),
    async (req, res) => {
        const { name, surname, specialty, licenseNumber, login, password } =
            req.body;

        try {
            let image = null;
            if (req.file) {
                image = `${req.file.filename}`;
            }

            const newUser = new User({
                login,
                password,
                rol: "physio",
            });

            const savedUser = await newUser.save();

            try {
                const newPhysio = new Physio({
                    _id: savedUser._id,
                    name,
                    surname,
                    specialty,
                    licenseNumber,
                    image,
                });

                const savedPhysio = await newPhysio.save();

                return res.status(201).render("physios/physio_detail", {
                    title: `Physio Added - ${savedPhysio.name} ${savedPhysio.surname}`,
                    physio: savedPhysio,
                    message: "Physio successfully added!",
                });
            } catch (error) {
                await User.findByIdAndDelete(savedUser._id);
                throw error;
            }
        } catch (error) {
            if (req.file) {
                deleteImage(req.file.filename);
            }

            const errors = {
                general: "An error occurred while creating the physio.",
            };

            if (error.name === "ValidationError" || error.code === 11000) {
                if (error.errors) {
                    if (error.errors.name)
                        errors.name = error.errors.name.message;
                    if (error.errors.surname)
                        errors.surname = error.errors.surname.message;
                    if (error.errors.specialty)
                        errors.specialty = error.errors.specialty.message;
                    if (error.errors.licenseNumber)
                        errors.licenseNumber =
                            error.errors.licenseNumber.message;
                    if (error.errors.login)
                        errors.login = error.errors.login.message;
                    if (error.errors.password)
                        errors.password = error.errors.password.message;
                }

                if (error.code === 11000) {
                    if (error.message.includes("licenseNumber")) {
                        errors.licenseNumber = "License number must be unique.";
                    }
                    if (error.message.includes("login")) {
                        errors.login = "Login must be unique.";
                    }
                }

                return res.render("physios/physio_add", {
                    title: "Add Physio - Validation Error",
                    physio: { name, surname, specialty, licenseNumber, login },
                    errors,
                });
            }

            res.status(500).render("error", {
                title: "Internal Server Error",
                error: "An error occurred while processing the request.",
                code: 500,
            });
        }
    }
);

// .delete
router.delete("/:id", allowedRoles("admin"), async (req, res) => {
    const { id } = req.params;

    try {
        const physio = await Physio.findById(id);

        if (!physio) {
            return res.status(404).render("error", {
                title: "Physio Not Found",
                error: `No physio found with ID: ${id}`,
                code: 404,
            });
        }

        await Physio.findByIdAndDelete(id);
        await User.findByIdAndDelete(id);

        res.redirect(req.baseUrl);
    } catch (error) {
        res.status(500).render("error", {
            title: "Internal Server Error",
            error: `An error occurred while deleting the physio with ID: ${id}`,
            code: 500,
        });
    }
});

const deleteImage = (imageName) => {
    const fullPath = imageName.startsWith("/public/uploads/")
        ? path.join(process.cwd(), imageName)
        : path.join(process.cwd(), `/public/uploads/${imageName}`);

    fs.unlink(fullPath, (error) => {
        if (error) {
            console.warn(`Failed to delete image at \"${imageName}\".`);
        }
    });
};

module.exports = router;
