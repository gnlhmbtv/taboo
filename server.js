const express = require("express");
const cors = require('cors');
const bodyParser = require("body-parser");
const { pool } = require('./dbConfig');
const { registerUser, loginUser, deleteUser } = require("./auth");
const { getRandomCardWithForbiddenWords, addCard, deleteCard } = require('./card');
const {webSocketServer} = require('./websocket');
const { sendMessage, getMessagesForUser } = require('./message');


const app = express();
app.use(bodyParser.json());
// Configure CORS to allow requests from 'http://127.0.0.1:5500'
const corsOptions = {
  origin: 'http://127.0.0.1:5500',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// retrieve message endpoint
app.get('/messages/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
      // Retrieve messages for the specified user from the database
      const messages = await getMessagesForUser(userId);
      res.status(200).json(messages);
  } catch (error) {
      console.error('Error retrieving messages:', error.message);
      res.status(500).json({ error: 'Error retrieving messages' });
  }
});

// Define a route to handle sending messages via WebSocket
app.post('/send-message', async (req, res) => {
  const { senderId, receiverId, messageContent } = req.body;

  try {
      // Send message using the sendMessage function
      const messageId = await sendMessage(senderId, receiverId, messageContent);

      // Broadcast the new message to all connected WebSocket clients
      webSocketServer.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'message', messageId }));
          }
      });

      res.status(200).json({ success: true, messageId });
  } catch (error) {
      console.error('Error sending message:', error.message);
      res.status(500).json({ success: false, error: 'Error sending message' });
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

