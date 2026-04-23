require("dotenv").config();
const express = require("express");
const app = express();
const router = require("./routes");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("query parser", "extended");

app.use(cors());

app.use(router);

app.use(errorHandler);

module.exports = app;
