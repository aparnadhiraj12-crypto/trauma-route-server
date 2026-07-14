// sockets/index.js
const { Server } = require("socket.io");
const { updateHospitalStatus } = require("../data/hospitalStore");

function initSockets(server) {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.CLIENT_PARAMEDIC_URL,
    process.env.CLIENT_HOSPITAL_URL,
  ].filter(Boolean);

  const codespaceOriginPattern = /^https:\/\/.*\.app\.github\.dev$/;

  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || codespaceOriginPattern.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS: " + origin));
        }
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Hospital dashboard sends: { hospitalId, specialties?, resources? }
    socket.on("hospital:updateStatus", (payload) => {
      const updated = updateHospitalStatus(payload);
      if (!updated) {
        console.warn("hospital:updateStatus — unknown hospitalId:", payload.hospitalId);
        return;
      }
      // Broadcast the FULL updated hospital object so paramedic apps have
      // complete, consistent data (not just the partial fields that changed).
      io.emit("hospital:statusChanged", updated);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = { initSockets };