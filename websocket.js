const WebSocket = require('ws');
const { sendMessage } = require('./message');

const wss = new WebSocket.Server({ port: 3000 }); // WebSocket server initialization

// Map to store WebSocket connections and their corresponding user IDs
const clients = new Map();

wss.on('connection', function connection(ws) {
    console.log('WebSocket Client connected');

    // Handle incoming messages from clients
    ws.on('message', async (message) => {
        try {
            // Parse the incoming message
            const data = JSON.parse(message);

            // Determine the type of message
            switch (data.type) {
                case 'join_room':
                    // Associate the WebSocket connection with the user ID and room ID
                    clients.set(socket, { userId: data.userId, roomId: data.roomId });
                    console.log(`User ${data.userId} joined room ${data.roomId}`);
                    break;
                case 'message':
                    // Broadcast the message to all clients in the same room
                    const sender = clients.get(socket);
                    if (sender) {
                        const roomMembers = Array.from(clients.entries())
                            .filter(([clientSocket, clientData]) => clientData.roomId === sender.roomId && clientSocket !== socket);
                        roomMembers.forEach(([memberSocket, memberData]) => {
                            memberSocket.send(JSON.stringify({ type: 'message', content: data.content }));
                        });
                    }
                    break;
                default:
                    console.warn('Unknown WebSocket message type:', data.type);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    });

    // Handle WebSocket connection closure
    ws.on('close', () => {
        // Remove the WebSocket connection from the clients map
        clients.delete(ws);
        console.log('WebSocket client disconnected');
    });
});

module.exports = { webSocketServer: wss };