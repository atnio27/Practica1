// Carga de librerias
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const nunjucks = require("nunjucks");
const methodOverride = require("method-override");
const session = require("express-session");

dotenv.config();

// Entrutadores
const auth = require("./routes/auth.js");
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

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        expires: new Date(Date.now() + 60 * 60 * 1000),
    })
);

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
app.use("/public", express.static(__dirname + "/public"));
app.use((req, res, next) => {
    const noParamUrl = req.originalUrl.split("?")[0];
    const currentUrl = noParamUrl.split("/")[1];
    const newMode = noParamUrl.endsWith("new");

    res.locals.session = req.session;
    res.locals.currentUrl = currentUrl;
    res.locals.newMode = newMode;

    next();
});
app.use(express.static(__dirname + "/node_modules/bootstrap/dist"));
app.use("/auth", auth);
app.use("/patients", patients);
app.use("/physios", physios);
app.use("/records", records);

// Puesta en marcha del servidor
app.listen(process.env.PORT);
