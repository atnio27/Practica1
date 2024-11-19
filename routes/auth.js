const express = require("express");
const User = require("../models/users.js");
const bcrypt = require("bcrypt");
const router = express.Router();
const { generateToken } = require("../auth/auth");

// Loguear a un usuario
router.post("/login", async (req, res) => {
    const { login, password } = req.body;

    try {
        const user = await User.findOne({ login });

        // Si el usuario no existe o no hay contraseña
        if (!user || !password) {
            return res.status(401).json({
                error: "Incorrect login",
                result: null,
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Si la contraseña es incorrecta
        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Incorrect login",
                result: null,
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            result: token,
            error: null,
        });
    } catch (error) {
        return res.status(500).json({
            error: "Internal server error" + error,
            result: null,
        });
    }
});

module.exports = router;
