const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer_name: {
      type: String,
      required: true,
      trim: true,
    },
    product_name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered"],
      default: "pending",
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We manage updated_at manually to mirror the SQL schema
    versionKey: false,
  }
);

// Keep updated_at in sync on every save/update
orderSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

orderSchema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function (next) {
  this.set({ updated_at: new Date() });
  next();
});

module.exports = mongoose.model("Order", orderSchema);
