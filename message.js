const { pool } = require("./dbConfig.js");

// Function to send a message
async function sendMessage(senderId, messageContent, roomId) {
    try {
        const client = await pool.connect();
        const query = `
            INSERT INTO messages (sender_id, message_content, room_id)
            VALUES ($1, $2, $3)
            RETURNING id`;
        const values = [senderId, messageContent, roomId];
        const result = await client.query(query, values);
        client.release();
        return result.rows[0].id; // Return the ID of the newly inserted message
    } catch (error) {
        throw new Error(`Error sending message: ${error.message}`);
    }
}

// Function to retrieve messages for a given user
async function getMessagesForUser(userId) {
    try {
        const client = await pool.connect();
        const query = `
            SELECT *
            FROM messages
            WHERE receiver_id = $1
            ORDER BY timestamp DESC`;
        const values = [userId];
        const result = await client.query(query, values);
        client.release();
        return result.rows; // Return an array of messages
    } catch (error) {
        throw new Error(`Error retrieving messages: ${error.message}`);
    }
}

// Function to handle message notifications (e.g., mark messages as read)
// async function handleMessageNotification(userId, messageId) {
//     try {
//         const client = await pool.connect();
//         const query = `
//             UPDATE messages
//             SET is_read = true
//             WHERE receiver_id = $1 AND id = $2`;
//         const values = [userId, messageId];
//         await client.query(query, values);
//         client.release();
//     } catch (error) {
//         throw new Error(`Error handling message notification: ${error.message}`);
//     }
// }

module.exports = {
    sendMessage,
    getMessagesForUser
};
