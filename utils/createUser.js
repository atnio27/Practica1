const User = require("../models/users");
const bcrypt = require("bcrypt");

async function createUser(login, password, rol) {
    const newUser = new User({
        login: login,
        password: await bcrypt.hash(password, 10),
        rol: rol,
    });

    if (!login || !password) {
        return res.status(400).json({
            error: "Missing login or password",
            result: null,
        });
    }

    newUser.save();

    return newUser;
}

module.exports = {
    createUser,
};
