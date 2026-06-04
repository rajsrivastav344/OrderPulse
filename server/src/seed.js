/**
 * seed.js — Populates the orders collection with realistic sample data.
 * Run once: node src/seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("./orderModel");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ordersdb";

const CUSTOMERS = [
  "Priya Sharma", "Rahul Verma", "Aisha Khan", "James O'Brien",
  "Liu Wei", "Sofia Martínez", "Arjun Patel", "Emily Chen",
];

const PRODUCTS = [
  "Mechanical Keyboard", "Wireless Headphones", "USB-C Hub", "Standing Desk Mat",
  "Monitor Arm", "Webcam HD", "Ergonomic Mouse", "Laptop Stand",
];

const STATUSES = ["pending", "shipped", "delivered"];

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  await Order.deleteMany({});
  console.log("Cleared existing orders");

  const orders = Array.from({ length: 15 }, () => ({
    customer_name: random(CUSTOMERS),
    product_name: random(PRODUCTS),
    status: random(STATUSES),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  }));

  await Order.insertMany(orders);
  console.log(`Inserted ${orders.length} sample orders`);

  await mongoose.disconnect();
  console.log("Done. Run 'npm start' to launch the server.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
