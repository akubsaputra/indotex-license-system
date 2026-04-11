require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const pool = require("./config/db");
const licenseRoutes = require("./routes/license.routes");

const app = express();

app.use(cors());
app.use(express.json());

/* API ROUTES */
app.use("/api/license", licenseRoutes);

/* STATIC DASHBOARD */
app.use(express.static(path.join(__dirname, "../")));

/* DASHBOARD ROUTE */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../dashboard.html"));
});

/* TEST DB */
pool.query("SELECT NOW()")
    .then(() => console.log("PostgreSQL Connected"))
    .catch(err => console.error(err));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});