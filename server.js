const express = require("express");
const bodyParser = require("body-parser");
const { pool } = require('./dbConfig');
const { registerUser, loginUser } = require("./auth");

const app = express();
app.use(bodyParser.json());

// Get all users endpoint
app.get("/users", async (req, res) => {
    try {
      const result = await pool.query("SELECT id, name FROM users");
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Failed to fetch users");
    }
  });

// Register user endpoint
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    const isRegistered = await registerUser(username, password);
    if (isRegistered) {
      res.status(201).send("User registered successfully");
    } else {
      res.status(500).send("Failed to register user");
    }
  });

// Login user endpoint
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    const user = await loginUser(username, password);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(401).send("Invalid username or password");
    }
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

