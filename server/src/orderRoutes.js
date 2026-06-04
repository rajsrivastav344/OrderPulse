const express = require("express");
const router = express.Router();
const Order = require("./orderModel");

// GET /api/orders — paginated list, newest first
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find().sort({ updated_at: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(),
    ]);

    res.json({ orders, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id — single order
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders — create a new order
router.post("/", async (req, res) => {
  try {
    const { customer_name, product_name, status } = req.body;
    const order = new Order({ customer_name, product_name, status });
    await order.save();
    // Change Stream fires automatically — no manual WebSocket call needed here
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/orders/:id — partial update (e.g., change status)
router.patch("/:id", async (req, res) => {
  try {
    const allowed = ["customer_name", "product_name", "status"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...updates, updated_at: new Date() },
      { new: true, runValidators: true }
    ).lean();

    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/orders/:id
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted", _id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
