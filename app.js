// app.js
const express = require("express");
const cors = require("cors");

const hospitalsRouter = require("./routes/hospitals");
const alertsRouter = require("./routes/alerts");

const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_PARAMEDIC_URL,
  process.env.CLIENT_HOSPITAL_URL,
].filter(Boolean);

const codespaceOriginPattern = /^https:\/\/.*\.app\.github\.dev$/;

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || codespaceOriginPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Trauma Route server is running" });
});

app.use("/api/hospitals", hospitalsRouter);
app.use("/api/alerts", alertsRouter);

module.exports = app;