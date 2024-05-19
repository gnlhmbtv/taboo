const bcrypt = require("bcrypt");
const { pool } = require("./dbConfig.js");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

function generateToken(userId) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
  return token;
}

const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization ? authorization.split(" ")[1] : null;
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.userId = decoded.userId; // Store userId in the request
    next(); // Continue to the next middleware or route handler
  });
};

const getUserDetails = async (userId) => {
  const query = "SELECT id, name FROM users WHERE id = $1";
  const result = await pool.query(query, [userId]); 
  return result.rows[0]; // Return the user details
};


async function registerUser(username, password) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if the username already exists
    const checkQuery = "SELECT id FROM users WHERE name = $1";
    const checkResult = await client.query(checkQuery, [username]);

    if (checkResult.rows.length > 0) {
      // User with the same username already exists
      throw new Error("User already exists");
      console.log(checkResult.rows.length)
    }

    // If the username doesn't exist, proceed with the registration
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = "INSERT INTO users (name, password) VALUES ($1, $2) RETURNING id";
    const result = await client.query(insertQuery, [username, hashedPassword]);
    await client.query('COMMIT');
    return result.rows[0].id; // Return the inserted ID
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error registering user:", error.message);
    throw error; // Rethrow the error
  } finally {
    client.release();
  }
}

async function deleteUser(username) {
  try {
    const query = "DELETE FROM users WHERE name = $1";
    const result = await pool.query(query, [username]);
    if (result.rowCount === 1) {
      return true; // Deletion successful
    } else {
      return false; // User not found or deletion unsuccessful
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return false; // Deletion failed
  }
}

async function loginUser(username, password) {
  try {
    const result = await pool.query("SELECT * FROM users WHERE name = $1", [
      username,
    ]);
    const user = result.rows[0];
    if (!user) {
      return null; // User not found
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = generateToken(user.id); // Generate JWT token
      return { token, user }; // Return token and user info
    } else {
      return null;
    } 
  } catch (error) {
    console.error("Error logging in:", error);
    return null; // Login failed
  }
}

module.exports = { registerUser, loginUser, deleteUser, generateToken, verifyToken, getUserDetails };
