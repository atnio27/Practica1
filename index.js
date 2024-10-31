// Carga de librerias
const express = require("express");
const mongoose = require("mongoose");

// Entrutadores
const patients = require("./routes/patients.js");
const physios = require("./routes/physios.js");
const records = require("./routes/records.js");

// Conectar con BD en Mongo
mongoose
    .connect("mongodb://127.0.0.1:27017/physiocare")
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

// Puesta en marcha del servidor
app.listen(8080);
