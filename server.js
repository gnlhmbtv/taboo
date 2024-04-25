const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const { pool } = require('./dbConfig');
const { registerUser, loginUser, deleteUser, generateToken, verifyToken, getUserDetails } = require("./auth");
const { getRandomCardWithForbiddenWords, addCard, deleteCard } = require('./card');

dotenv.config(); // Load environment variables

const JWT_SECRET = process.env.JWT_SECRET; // Get JWT secret from .env
const app = express();
app.use(bodyParser.json());
app.use(cors());


// Endpoint to get the current user's details
app.get("/currentUser", verifyToken, async (req, res) => {
// Accessing 'userId' using bracket notation
  const userId = req["userId"]; 

  if (!userId) {
    return res.status(401).json({ error: "User ID not found in token" });
  }

  try {
    const user = await getUserDetails(userId);
    if (user) {
      res.status(200).json({ user });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Failed to get user details" });
  }
});



function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Get the token from the header

  if (!token) {
    return res.status(401).json({ error: "Token not provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Decode the token

    // Check if the decoded token has the expected structure
    if (typeof decoded !== "object" || !("userId" in decoded)) {
      throw new Error("Invalid token structure"); // Handle unexpected structure
    }

    req.userId = decoded.userId; // Safely access userId
    next(); // Continue to the next middleware
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" }); // Handle invalid token
  }
}



// Login user endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body; // De-structure username and password from request body

  // Check if either username or password is missing
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" }); // Corrected error handling
  }

  // Continue with login process
  const loginResult = await loginUser(username, password);
  if (loginResult) {
    const { token, user } = loginResult;
    return res.status(200).json({ token, user });
  } else {
    return res.status(401).json({ error: "Invalid username or password" });
  }
});




// Route to get a random card with one main word and 6 random forbidden words
app.get("/card", authenticateToken, async (req, res) => {
  try {
    const card = await getRandomCardWithForbiddenWords();
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch card" });
  }
});


// Get all cards endpoint
app.get("/cards", async (req, res) => {
  try {
    const query = "SELECT * FROM taboo_cards";
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).send("Failed to fetch cards");
  }
});



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


// // Route to get a random card with one main word and 6 random forbidden words
// app.get('/card', async (req, res) => {
//   try {
//     const card = await getRandomCardWithForbiddenWords();
//     res.json(card);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch card' });
//   }
// });


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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

