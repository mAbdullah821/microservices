const express = require("express");
const ServiceDiscoveryClient = require("./service-discovery-client");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;
const instanceId = `order-service-${port}`;

// Initialize service discovery client
const client = new ServiceDiscoveryClient("http://localhost:3000");

app.use(express.json());

// Enable CORS
app.use(cors());

// In-memory order data
const orders = [
  {
    id: 1,
    userId: 1,
    product: "Laptop",
    amount: 999.99,
    status: "completed",
    date: "2024-01-15",
  },
  {
    id: 2,
    userId: 1,
    product: "Mouse",
    amount: 29.99,
    status: "pending",
    date: "2024-01-20",
  },
  {
    id: 3,
    userId: 2,
    product: "Keyboard",
    amount: 79.99,
    status: "completed",
    date: "2024-01-18",
  },
  {
    id: 4,
    userId: 2,
    product: "Monitor",
    amount: 299.99,
    status: "shipped",
    date: "2024-01-22",
  },
  {
    id: 5,
    userId: 3,
    product: "Headphones",
    amount: 149.99,
    status: "completed",
    date: "2024-01-10",
  },
];

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    service: "order-service",
    instance: instanceId,
    port: port,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Get orders for a specific user
app.get("/orders/user/:userId", (req, res) => {
  const userOrders = orders.filter(
    (order) => order.userId === +req.params.userId
  );

  res.json({
    orders: userOrders,
    userId: +req.params.userId,
    instance: instanceId,
    total: userOrders.length,
  });
});

// Start server and register with service discovery
app.listen(port, async () => {
  console.log(`🚀 Order Service [${instanceId}] running on port ${port}`);

  try {
    await client.register("order-service", parseInt(port));
    console.log(
      `✅ Order Service [${instanceId}] registered with discovery server`
    );
  } catch (error) {
    console.error(
      `❌ Failed to register Order Service [${instanceId}]:`,
      error.message
    );
  }
});

module.exports = app;
