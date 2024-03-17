const express = require("express");
const bodyParser = require("body-parser");
const { pool } = require('./dbConfig');
const { registerUser, loginUser, deleteUser } = require("./auth");

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

// DELETE user endpoint
app.delete("/users/:username", async (req, res) => {
  const username = req.params.username;
  try {
    const deleted = await deleteUser(username);
    if (deleted) {
      res.status(200).json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found or deletion unsuccessful" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});


// Register user endpoint
app.post("/register", async (req, res) => {
  const { username, password } = req.body; // Extract username and password from request body
  try {
    // Attempt to register the user
    const userId = await registerUser(username, password);
    if (userId) {
      res.status(201).json({ message: "User registration successful", userId });
    } else {
      res.status(400).json({ error: "User already exists" });
    }
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).json({ error: "Unsuccessful registration" });
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

