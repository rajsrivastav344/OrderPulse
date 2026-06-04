# OrderPulse — Real-Time Order Tracker

A production-quality real-time notification system built with **Node.js**, **MongoDB Change Streams**, **WebSockets**, and **React**.

```
┌─────────────┐     Change Stream     ┌───────────────────┐     WebSocket     ┌────────────────┐
│  MongoDB    │ ──────────────────▶  │  Node.js Server   │ ────────────────▶ │  React Client  │
│  (orders)   │     (push, no poll)   │  Express + ws     │   (typed events)  │  Live UI       │
└─────────────┘                       └───────────────────┘                   └────────────────┘
```

---

## How It Works

### Why MongoDB Change Streams?

MongoDB Change Streams (available on replica sets and Atlas) expose a **real-time stream of all insert / update / delete operations** directly from the database's oplog. This means:

- **Zero polling** — the server is notified by the database the instant something changes.
- **Resume tokens** — if the server restarts, Mongoose can resume the stream without missing events.
- **Granular events** — each event carries the `operationType` (`insert`, `update`, `replace`, `delete`) plus the full document after the change (`fullDocument: 'updateLookup'`).

### Why WebSockets?

- HTTP is request/response — the server can't push to clients without tricks like long-polling or SSE.
- WebSockets provide a **persistent bi-directional channel** with very low overhead per message.
- The `ws` library is lean, battle-tested, and integrates cleanly with Node's `http.Server`.

### Data flow (end to end)

1. A client calls `POST /api/orders` (or `PATCH`, `DELETE`).
2. Mongoose writes the change to MongoDB.
3. MongoDB emits a change event on the oplog.
4. The Change Stream listener in the server receives it immediately.
5. The server broadcasts a typed JSON message (`ORDER_INSERTED` / `ORDER_UPDATED` / `ORDER_DELETED`) over WebSocket to **all connected clients**.
6. Each React client applies the change to local state — no re-fetch needed.

---

## Project Structure

```
realtime-orders/
├── docker-compose.yml          # Local MongoDB replica set (for Change Streams)
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js            # Entry point — connects DB, starts HTTP + WS
│       ├── orderModel.js       # Mongoose schema (mirrors the SQL spec: id, customer_name, product_name, status, updated_at)
│       ├── orderRoutes.js      # REST CRUD: GET / POST / PATCH / DELETE /api/orders
│       ├── changeStreamWatcher.js  # Opens Change Stream → calls wsManager.broadcast()
│       ├── wsManager.js        # WebSocket server singleton: tracks clients, heartbeat, broadcast
│       └── seed.js             # Seeds 15 sample orders
└── client/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.js              # Root component — owns orders state, wires WS handler
        ├── hooks/
        │   └── useWebSocket.js # WS hook with auto-reconnect + exponential back-off
        ├── lib/
        │   └── api.js          # Thin fetch wrapper for REST API
        └── components/
            ├── OrderRow.js         # Table row — click status badge to cycle, DEL button
            ├── StatusBadge.js      # Colour-coded status indicator
            ├── EventLog.js         # Scrollable live event feed
            ├── ConnectionStatus.js # WS connection indicator in header
            └── CreateOrderModal.js # Modal form to create new orders
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Docker + Docker Compose | any recent |

> **MongoDB Change Streams require a replica set.** The `docker-compose.yml` sets one up automatically. If you use Atlas, any free tier cluster works out of the box.

---

## Quick Start

### 1. Start MongoDB (replica set)

```bash
docker-compose up -d
# Wait ~10 seconds for the replica set to initialise
```

### 2. Start the server

```bash
cd server
cp .env.example .env       # defaults work with docker-compose
npm install
npm run seed               # optional: seed 15 sample orders
npm start
# Server → http://localhost:4000
```

### 3. Start the React client

```bash
cd client
npm install
npm start
# Client → http://localhost:3000
```

### 4. Open two browser tabs at http://localhost:3000

Any action in one tab (create, status change, delete) appears **instantly** in the other.

---

## REST API

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/api/orders?page=1&limit=20` | — | Paginated list, newest first |
| GET | `/api/orders/:id` | — | Single order |
| POST | `/api/orders` | `{ customer_name, product_name, status? }` | Create order |
| PATCH | `/api/orders/:id` | `{ status?, customer_name?, product_name? }` | Partial update |
| DELETE | `/api/orders/:id` | — | Delete order |
| GET | `/health` | — | Server health + connected WS clients |

---

## WebSocket Events

All messages are JSON:

```json
{
  "type": "ORDER_INSERTED | ORDER_UPDATED | ORDER_DELETED | CONNECTED",
  "payload": { /* full order document, or { _id } for deletes */ },
  "timestamp": "2024-06-04T12:00:00.000Z"
}
```

---

## Scalability Notes

| Concern | Approach |
|---------|---------|
| Multiple server instances | Replace the in-process `Set` in `wsManager` with a Redis pub/sub fan-out. Each instance subscribes; one broadcasts. |
| Millions of orders | Change Stream already streams changes; add indexes on `status` and `updated_at` for queries. |
| WebSocket load | Use a WebSocket-aware load balancer (sticky sessions or Redis pub/sub). |
| Auth | Add JWT verification in the `ws.on('connection')` handler and REST middleware. |
| Reconnection | The client hook uses exponential back-off (3s → 6s → 12s … 30s max). |

---

## Environment Variables

### Server (`server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb+srv://srivastavraj344_db_user:OTCgzsgadxgvhjgfDPCFmxBey2lod@cluster0.ahoms1l.mongodb.net/?appName=Cluster0` | MongoDB connection string |
| `PORT` | `4000` | HTTP + WebSocket port |

### Client

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:4000/api` | REST API base URL |
| `REACT_APP_WS_URL` | `ws://localhost:4000` | WebSocket URL |

---

## Design Decisions

**Change Streams over polling** — Polling every N seconds wastes resources and adds latency proportional to the interval. Change Streams are event-driven: 0 ms artificial delay, no wasted queries.

**WebSockets over SSE** — Server-Sent Events are HTTP/1.1 unidirectional and limited to 6 connections per browser per domain. WebSockets are bidirectional and not connection-limited, which also keeps the door open for future client→server messaging.

**Singleton WsManager** — A module-level singleton lets `changeStreamWatcher` and any future module broadcast without prop-drilling the WS server reference.

**fullDocument: 'updateLookup'** — Without this option, update events only carry the diff. With it, every change event includes the full document, so clients always have complete data.

**In-memory state on the client** — The React client applies patches to its local `orders` array from WS events, avoiding a full re-fetch on every change. The initial HTTP GET provides the snapshot; WS keeps it live.
