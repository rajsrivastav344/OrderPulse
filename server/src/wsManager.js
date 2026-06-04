const { WebSocketServer, WebSocket } = require("ws");

/**
 * WebSocketManager
 * Encapsulates all WebSocket logic:
 *  - Tracks connected clients
 *  - Sends heartbeat pings to detect stale connections
 *  - Broadcasts typed event payloads to all live clients
 */
class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.PING_INTERVAL_MS = 30_000;
    this._pingTimer = null;
  }

  /**
   * Attach the WebSocket server to an existing HTTP server.
   * @param {http.Server} httpServer
   */
  attach(httpServer) {
    this.wss = new WebSocketServer({ server: httpServer });

    this.wss.on("connection", (ws, req) => {
      const ip = req.socket.remoteAddress;
      console.log(`[WS] Client connected — ${ip} (total: ${this.clients.size + 1})`);

      ws.isAlive = true;
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // Send a welcome snapshot so the client knows it's connected
      this._send(ws, { type: "CONNECTED", message: "Subscribed to order updates", timestamp: new Date().toISOString() });

      this.clients.add(ws);

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log(`[WS] Client disconnected (total: ${this.clients.size})`);
      });

      ws.on("error", (err) => {
        console.error("[WS] Socket error:", err.message);
        this.clients.delete(ws);
      });
    });

    this._startHeartbeat();
    console.log("[WS] WebSocket server attached");
  }

  /**
   * Broadcast a typed event to every live client.
   * @param {"ORDER_INSERTED"|"ORDER_UPDATED"|"ORDER_DELETED"} type
   * @param {object} payload
   */
  broadcast(type, payload) {
    const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    let delivered = 0;

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        delivered++;
      }
    }

    console.log(`[WS] Broadcast ${type} → ${delivered}/${this.clients.size} clients`);
  }

  /** Send a message to a single socket (safe, catches errors). */
  _send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /** Periodically ping clients; terminate those that don't respond. */
  _startHeartbeat() {
    this._pingTimer = setInterval(() => {
      for (const ws of this.clients) {
        if (!ws.isAlive) {
          ws.terminate();
          this.clients.delete(ws);
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }, this.PING_INTERVAL_MS);
  }

  shutdown() {
    clearInterval(this._pingTimer);
    this.wss?.close();
  }
}

// Export a singleton so the change-stream watcher can import and reuse it
module.exports = new WebSocketManager();