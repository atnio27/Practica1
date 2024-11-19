const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    login: {
        type: String,
        minlenght: 4,
        unique: true,
    },
    password: {
        type: String,
        minlenght: 7,
    },
    rol: {
        type: String,
        require: true,
        enum: ["admin", "physio", "patient"],
    },
});

// Crear el modelo de User
const User = mongoose.model("Users", userSchema);
module.exports = User;
