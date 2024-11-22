const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const generateToken = (user) => {
    const payload = {
        id: user._id,
        login: user.login,
        rol: user.rol,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
    });

    return token;
};

const verifyToken = (token) => {
    try {
        const result = jwt.verify(token, process.env.JWT_SECRET);
        return {
            valid: true,
            result,
        };
    } catch (error) {
        return {
            valid: false,
            result: null,
        };
    }
};

const authorize = (allowedRoles) => {
    return (req, res, next) => {
        const token = req.headers["authorization"]
            ? req.headers["authorization"].split(" ")[1]
            : null;

        if (!token) {
            return res.status(403).json({
                error: "Unauthorised access: token not provided.",
            });
        }

        const { valid, result } = verifyToken(token);

        // Si el token no es valido
        if (!valid) {
            return res.status(403).json({
                error: "Unauthorised access: token is not vaild.",
            });
        }

        // Si el rol no es valido
        if (!allowedRoles.includes(result.rol)) {
            return res.status(403).json({
                error: "Unauthorised access for this rol: " + result.rol,
            });
        }

        req.user = result;
        next();
    };
};

module.exports = {
    generateToken,
    verifyToken,
    authorize,
};
