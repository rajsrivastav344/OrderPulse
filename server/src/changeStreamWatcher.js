const Order = require("./orderModel");
const wsManager = require("./wsManager");

/**
 * changeStreamWatcher
 *
 * Opens a MongoDB Change Stream on the `orders` collection.
 * Maps each change event type to a typed WebSocket broadcast so
 * connected clients receive granular, actionable notifications.
 *
 * Why Change Streams?
 *  - Native to MongoDB (replica set / Atlas) — no extra infra needed
 *  - Push-based: zero polling overhead
 *  - Resume tokens allow automatic reconnection without missed events
 */
function watchOrders() {
  // fullDocument: 'updateLookup' fetches the complete document after updates,
  // so clients always receive the full order — not just the diff.
  const pipeline = []; // No filter: watch all operations
  const options = { fullDocument: "updateLookup" };

  const changeStream = Order.watch(pipeline, options);

  changeStream.on("change", (change) => {
    const { operationType, fullDocument, documentKey } = change;

    switch (operationType) {
      case "insert":
        wsManager.broadcast("ORDER_INSERTED", normalizeOrder(fullDocument));
        break;

      case "update":
      case "replace":
        wsManager.broadcast("ORDER_UPDATED", normalizeOrder(fullDocument));
        break;

      case "delete":
        // On delete, MongoDB only gives us the _id
        wsManager.broadcast("ORDER_DELETED", { _id: documentKey._id });
        break;

      default:
        // Ignore internal operations (drop, invalidate, etc.)
        break;
    }
  });

  changeStream.on("error", (err) => {
    console.error("[ChangeStream] Error:", err.message);
    // Mongoose will automatically attempt to resume using the last resume token
  });

  console.log("[ChangeStream] Watching 'orders' collection for changes…");
  return changeStream;
}

/** Normalize a raw Mongoose document into a plain serializable object. */
function normalizeOrder(doc) {
  if (!doc) return null;
  return {
    _id: doc._id,
    customer_name: doc.customer_name,
    product_name: doc.product_name,
    status: doc.status,
    updated_at: doc.updated_at,
  };
}

module.exports = { watchOrders };
