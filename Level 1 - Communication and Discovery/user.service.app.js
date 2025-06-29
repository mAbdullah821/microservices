const express = require("express");
const ServiceDiscoveryClient = require("./service-discovery-client");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4000;
const instanceId = `user-service-${port}`;

// Initialize service discovery client
const client = new ServiceDiscoveryClient("http://localhost:3000");

app.use(express.json());

// Enable CORS
app.use(cors());

// In-memory user data
const users = [
  { id: 1, name: "John Doe", email: "john@example.com", age: 30 },
  { id: 2, name: "Jane Smith", email: "jane@example.com", age: 25 },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", age: 35 },
];

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    service: "user-service",
    instance: instanceId,
    port: port,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Get all users with their orders
app.get("/users", async (req, res) => {
  try {
    // Get order service URL using service discovery
    const orderServiceUrl = await client.getServiceUrl("order-service");

    // Fetch orders for each user
    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        try {
          const response = await axios.get(
            `${orderServiceUrl}/orders/user/${user.id}`,
            { timeout: 5000 }
          );

          console.log(
            `✈️ User Service [${instanceId}] calling Order Service [${orderServiceUrl}]`
          );

          return {
            ...user,
            orders: response.data.orders,
          };
        } catch (error) {
          return {
            ...user,
            orders: [],
          };
        }
      })
    );

    res.json({
      users: usersWithOrders,
      instance: instanceId,
    });
  } catch (error) {
    res.status(503).json({
      error: "Order service unavailable",
      users: users.map((user) => ({ ...user, orders: [] })),
      instance: instanceId,
    });
  }
});

// Start server and register with service discovery
app.listen(port, async () => {
  console.log(`🚀 User Service [${instanceId}] running on port ${port}`);

  try {
    await client.register("user-service", parseInt(port));
    console.log(
      `✅ User Service [${instanceId}] registered with discovery server`
    );
  } catch (error) {
    console.error(
      `❌ Failed to register User Service [${instanceId}]:`,
      error.message
    );
  }
});

module.exports = app;
