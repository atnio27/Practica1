// Carga de librerias
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const nunjucks = require("nunjucks");
const methodOverride = require("method-override");

dotenv.config();

// Entrutadores
const patients = require("./routes/patients.js");
const physios = require("./routes/physios.js");
const records = require("./routes/records.js");

// Conectar con BD en Mongo
mongoose
    .connect(process.env.DATABASE)
    .then(() => console.log("Conectado a MongoDB en physiocare"))
    .catch((error) => console.error("Error al conectar a MongoDB:", error));

// Inicializar Express
const app = express();

// Configuramos motor Nunjucks
nunjucks.configure("views", {
    autoescape: true,
    express: app,
});

// Asignación del motor de plantillas
app.set("view engine", "njk");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware para procesar otras peticiones que no sean GET o POST
app.use(
    methodOverride(function (req, res) {
        if (req.body && typeof req.body === "object" && "_method" in req.body) {
            let method = req.body._method;
            delete req.body._method;
            return method;
        }
    })
);
app.use(express.static(__dirname + "/node_modules/bootstrap/dist"));
app.use("/patients", patients);
app.use("/physios", physios);
app.use("/records", records);

// Puesta en marcha del servidor
app.listen(process.env.PORT);

// const bcrypt = require("bcrypt");
// const User = require("./models/users.js");

// crearUsuarios();

// async function crearUsuarios() {
//     try {
//         // Hashear las contraseñas antes de crear los usuarios
//         const hashedAdminPassword = await bcrypt.hash("adminPass123", 10);
//         const hashedPhysioPassword = await bcrypt.hash("physioPass123", 10);
//         const hashedPatientPassword = await bcrypt.hash("patientPass123", 10);

//         await User.create([
//             {
//                 login: "antonioAdmin",
//                 password: hashedAdminPassword,
//                 rol: "admin",
//             },
//             {
//                 login: "antonioPhysio",
//                 password: hashedPhysioPassword,
//                 rol: "physio",
//             },
//             {
//                 login: "antonioPatient",
//                 password: hashedPatientPassword,
//                 rol: "patient",
//             },
//         ]);

//         console.log("Usuarios de prueba creados correctamente.");
//     } catch (error) {
//         console.error("Error creando usuarios de prueba:", error.message);
//     }
// }
