// Carga de librerias
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Entrutadores
const patients = require("./routes/patients.js");
const physios = require("./routes/physios.js");
const records = require("./routes/records.js");
const auth = require("./routes/auth.js");

// Conectar con BD en Mongo
mongoose
    .connect(process.env.DATABASE)
    .then(() => console.log("Conectado a MongoDB en physiocare"))
    .catch((error) => console.error("Error al conectar a MongoDB:", error));

// Inicializar Express
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Cargar los enrutadores
app.use("/patients", patients);
app.use("/physios", physios);
app.use("/records", records);
app.use("/auth", auth);

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
