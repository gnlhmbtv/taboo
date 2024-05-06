const { pool } = require("./dbConfig.js");
const { webSocketServer } = require('./websocket');

async function createRoom(roomName, initialMembers = []) {
    try {
        // Insert a new record into the rooms table with the provided room name
        const createRoomQuery = 'INSERT INTO rooms (room_name) VALUES ($1) RETURNING room_id';
        const roomResult = await pool.query(createRoomQuery, [roomName]);
        const roomId = roomResult.rows[0].room_id;

        // Add initial members to the room if provided
        if (initialMembers.length > 0) {
            const addMembersQuery = 'INSERT INTO room_members (room_id, user_id) VALUES ';
            const values = initialMembers.map(userId => `(${roomId}, ${userId})`).join(',');
            await pool.query(addMembersQuery + values);
        }

        // Emit a WebSocket event to notify clients about the new room
        webSocketServer.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'room_created', roomId, roomName }));
            }
        });

        return roomId;
    } catch (error) {
        throw new Error('Error creating room: ' + error.message);
    }
}

// Function to join an existing room
async function joinExistingRoom(userId, roomId) {
    try {
        // Check if the room exists
        const roomQuery = 'SELECT * FROM rooms WHERE room_id = $1';
        const roomResult = await pool.query(roomQuery, [roomId]);
        const room = roomResult.rows[0];
        if (!room) {
            throw new Error('Room not found');
        }

        // Check if the user is already a member of the room
        const memberQuery = 'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2';
        const memberResult = await pool.query(memberQuery, [roomId, userId]);
        const member = memberResult.rows[0];
        if (member) {
            throw new Error('User is already a member of the room');
        }

        // Add the user to the room
        const addMemberQuery = 'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)';
        await pool.query(addMemberQuery, [roomId, userId]);

        // Emit a WebSocket event to notify clients about the user joining the room
        webSocketServer.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'user_joined_room', roomId, userId }));
            }
        });

        return 'User joined the room successfully';
    } catch (error) {
        throw new Error('Error joining room: ' + error.message);
    }
}

async function getAvailableRooms() {
    try {
        const query = 'SELECT room_id, room_name FROM rooms';
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        throw new Error('Error fetching available rooms: ' + error.message);
    }
}

// Function to retrieve messages specific to a room
async function getMessagesForRoom(roomId) {
    try {
        const query = 'SELECT * FROM messages WHERE room_id = $1';
        const result = await pool.query(query, [roomId]);

        const messages = result.rows;

        // Broadcast the retrieved messages to WebSocket clients in the room
        const roomMembers = Array.from(clients.values())
            .filter(client => client.roomId === roomId);
        roomMembers.forEach(client => {
            client.send(JSON.stringify({ type: 'messages', messages }));
        });

        return messages;
    } catch (error) {
        throw new Error('Error fetching messages for room: ' + error.message);
    }
}
module.exports = { createRoom, joinExistingRoom, getAvailableRooms, getMessagesForRoom };