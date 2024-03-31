const bcrypt = require("bcrypt");
const { pool } = require("./dbConfig.js");

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
      return user; // Login successful
    } else {
      return null; // Incorrect password
    }
  } catch (error) {
    console.error("Error logging in:", error);
    return null; // Login failed
  }
}

module.exports = { registerUser, loginUser, deleteUser };
