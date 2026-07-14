// server.js
require("dotenv").config();
const http = require("http");
const app = require("./app");
const { initSockets } = require("./sockets");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);
const io = initSockets(server);

// make io accessible inside routes if needed (e.g. to broadcast after a REST call)
app.set("io", io);

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

