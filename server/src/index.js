require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const wsManager = require("./wsManager");
const { watchOrders } = require("./changeStreamWatcher");
const orderRoutes = require("./orderRoutes");

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ordersdb";

// ── Express app ────────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: "*" })); // Tighten in production
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", clients: wsManager.clients.size }));
app.use("/api/orders", orderRoutes);

// ── HTTP server (shared with WebSocket server) ─────────────────────────────────
const server = http.createServer(app);

// ── Boot sequence ──────────────────────────────────────────────────────────────
async function start() {
  try {
    // 1. Connect to MongoDB
    //    MongoDB Change Streams require a replica set or Atlas cluster.
    //    For local dev, run: mongod --replSet rs0
    //    Then in mongosh: rs.initiate()
    await mongoose.connect(MONGODB_URI);
    console.log(`[DB] Connected to MongoDB → ${MONGODB_URI}`);

    // 2. Attach WebSocket server to the HTTP server
    wsManager.attach(server);

    // 3. Start watching the orders collection
    watchOrders();

    // 4. Start listening
    server.listen(PORT, () => {
      console.log(`[Server] HTTP + WS listening on http://localhost:${PORT}`);
      console.log(`[Server] REST API: http://localhost:${PORT}/api/orders`);
      console.log(`[Server] WebSocket: ws://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[Server] Failed to start:", err.message);
    process.exit(1);
  }
}

// ── Graceful shutdown ──────────────────────────────────────────────────────────
process.on("SIGTERM", async () => {
  console.log("[Server] SIGTERM received — shutting down gracefully");
  wsManager.shutdown();
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});

start();
