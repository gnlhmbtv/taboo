import { getCurrentUser } from "../../Log in Taboo/index.js";

const messageFeed = document.getElementById('message-feed');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// WebSocket code
const socket = new WebSocket('ws://localhost:3000');

socket.onopen = function(event) {
    console.log('WebSocket connection established');
};

socket.onerror = function(error) {
    console.error('WebSocket error:', error);
};

socket.onmessage = function(event) {
    console.log('Message received:', event.data);
    // Handle incoming messages (if needed)
        };

function addMessage(message, isHost) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    if (isHost) {
        messageElement.classList.add('host-message');

    } else {
        messageElement.classList.add('participant-message');
    }
    messageFeed.appendChild(messageElement);
}
function sendMessageToBackend(senderId, receiverId, messageContent) {
    // Define the URL of the backend endpoint
    const url = 'http://localhost:5000/send-message';

    // Construct the request body
    const body = JSON.stringify({
        senderId: senderId,
        receiverId: receiverId,
        messageContent: messageContent
    });

    // Set up the fetch request
    fetch(url, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            return response.json();
        })
        .then(data => {
            console.log('Message sent successfully to backend:', data);
        })
        .catch(error => {
            console.error('Error sending message to backend:', error);
        });
}

function sendMessage() {
    const user = getCurrentUser()
    console.log(user)
    const messageContent = messageInput.value;
    if (messageContent.trim() !== '') {
        // addMessage(messageContent, true); // Assume the host writes the message
        const message = {
            type: 'send',
            senderId: 1,
            receiverId: 2,
            messageContent: messageContent

        }; 
       
        if(socket.readyState === WebSocket.OPEN){
            socket.send(JSON.stringify(message));
        }
        
        // Send the message to the backend via Fetch API
        // sendMessageToBackend(message.senderId, message.receiverId, message.messageContent);
        // messageInput.value = '';
        
    }


}

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message.trim() !== '') {
        addMessage(message);
        sendMessage()
        // You can also send the message to the server here if you're using backend
        messageInput.value = ''; // Clear the input field
    }
   
});






