const express = require("express");
const bodyParser = require("body-parser");
const { pool } = require('./dbConfig');
const { registerUser, loginUser, deleteUser } = require("./auth");
const { getRandomCardWithForbiddenWords, addCard, deleteCard } = require('./card');

const app = express();
app.use(bodyParser.json());


// DELETE card endpoint
app.delete("/card/:cardId", async (req, res) => {
  const cardId = req.params.cardId;
  try {
      const deleted = await deleteCard(cardId);
      if (deleted) {
          res.status(200).json({ message: "Card deleted successfully" });
      } else {
          res.status(404).json({ error: "Card not found or deletion unsuccessful" });
      }
  } catch (error) {
      console.error("Error deleting card:", error);
      res.status(500).json({ error: "Failed to delete card" });
  }
});

// Route to add a new card
app.post('/card', async (req, res) => {
  const { mainWord, forbiddenWords } = req.body;
  try {
    const cardId = await addCard(mainWord, forbiddenWords);
    res.status(201).json({ message: "Card added successfully", cardId });
  } catch (error) {
    console.error("Error adding card:", error.message);
    res.status(500).json({ error: "Failed to add card" });
  }
});


// Route to get a random card with one main word and 6 random forbidden words
app.get('/card', async (req, res) => {
  try {
      const card = await getRandomCardWithForbiddenWords();
      res.json(card);
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch card' });
  }
});


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
    res.status(201).json({ message: "User registration successful", userId });
  } catch (error) {
    if (error.message === "User already exists") {
      res.status(400).json({ error: error.message });
    } else {
      console.error("Error registering user:", error.message);
      res.status(500).json({ error: "Unsuccessful registration" });
    }
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

