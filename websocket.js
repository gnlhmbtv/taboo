const WebSocket = require('ws');
const { sendMessage } = require('./message');

const wss = new WebSocket.Server({ port: 8080 }); // WebSocket server initialization

wss.on('connection', function connection(ws) {
    console.log('Client connected');

    // Handle incoming messages from clients
    ws.on('message', async function incoming(message) {
        console.log('received: %s', message);
        const receivedMessage = JSON.parse(message);

        // Check the type of message
        switch (receivedMessage.type) {
            case 'send':
                // Send message to the appropriate recipient
                try {
                    const messageId = await sendMessage(receivedMessage.senderId, receivedMessage.receiverId, receivedMessage.messageContent);
                    // Broadcast the new message to all connected clients
                    wss.clients.forEach(function each(client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'message', messageId }));
                        }
                    });
                } catch (error) {
                    console.error('Error sending message:', error.message);
                }
                break;
            // Add other cases for different message types if needed
        }
    });

    // Handle client disconnection
    ws.on('close', function close() {
        console.log('Client disconnected');
    });
});

module.exports = { webSocketServer: wss };