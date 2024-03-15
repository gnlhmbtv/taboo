const bcrypt = require("bcrypt");
const { pool } = require("./dbConfig.js");

async function registerUser(username, password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = "INSERT INTO users (name, password) VALUES ($1, $2)";
        await pool.query(query, [username, hashedPassword]);
        return true; // Registration successful
    } catch (error) {
        console.error("Error registering user:", error);
        return false; // Registration failed
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
        return user; // Login successful
      } else {
        return null; // Incorrect password
      }
    } catch (error) {
      console.error("Error logging in:", error);
      return null; // Login failed
    }
  }

module.exports = { registerUser, loginUser };
