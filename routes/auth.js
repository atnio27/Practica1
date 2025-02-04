const express = require("express");
const User = require("../models/users.js");
const router = express.Router();

// .get
router.get("/login", async (req, res) => {
    return res.render("login", {
        title: "Login",
    });
});

router.get("/logout", async (req, res) => {
    req.session.destroy();
    return res.redirect("/auth/login");
});

// .post
router.post("/login", async (req, res) => {
    const { login, password } = req.body;
    const errors = {};

    if (!login) errors.login = "Login is required.";
    if (!password) errors.password = "Password is required.";

    if (Object.keys(errors).length > 0) {
        return res.render("login", {
            title: "Login - Error",
            errors,
            patient: { login },
        });
    }

    try {
        const user = await User.findOne({ login });

        if (!user || user.password !== password) {
            return res.render("login", {
                title: "Login - Error",
                errors: { login: "Invalid login or password." },
                patient: { login },
            });
        }

        req.session.user = { login: user.login, rol: user.rol, id: user._id };

        return res.redirect("/patients");
    } catch (err) {
        res.status(500).render("error", {
            title: "Error",
            error: `An error occurred while logging in.`,
            code: 500,
        });
    }
});

module.exports = router;
