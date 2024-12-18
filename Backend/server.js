const express = require('express');
const twilio = require('twilio');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Initialize Express
const app = express();
dotenv.config(); // Load environment variables

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json()); // For parsing JSON requests

// Twilio Credentials
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const twilioWhatsAppNumber = 'whatsapp:+14155238886'; // Replace with your Twilio WhatsApp number
const client = twilio(accountSid, authToken);

// Webhook to receive incoming messages
app.post('/webhook', async (req, res) => {
    const from = req.body.From; // Sender's WhatsApp number
    const messageBody = req.body.Body; // Message content

    if (!from || !messageBody) {
        console.error('Invalid request payload:', req.body);
        return res.status(400).send('Invalid request payload.');
    }

    console.log(`Message received from ${from}: ${messageBody}`);

    let reply;
    // Respond to different messages
    if (messageBody.toLowerCase() === 'hello') {
        reply = 'Hello! How can I assist you today?';
    } else if (messageBody.toLowerCase() === 'bye') {
        reply = 'Goodbye! Have a great day!';
    } else {
        reply = "I am not sure how to respond to that. Please try again.";
    }

    // Send the reply to the sender/
    try {
        await client.messages.create({
            from: twilioWhatsAppNumber, // Twilio WhatsApp number
            to: from, // Sender's WhatsApp number
            body: reply, // The response message
        });
        console.log(`Reply sent to ${from}: ${reply}`);
        res.status(200).send('Reply sent successfully!');
    } catch (error) {
        console.error('Error sending reply:', error.message);
        res.status(500).send('Failed to send reply.');
    }
});

// Route to manually send messages to multiple numbers
app.post('/send-whatsapp', (req, res) => {
    const { numbers, message } = req.body;

    if (!Array.isArray(numbers) || !message) {
        return res.status(400).send('Invalid request. Provide an array of numbers and a message.');
    }

    const promises = numbers.map((number) =>
        client.messages.create({
            from: twilioWhatsAppNumber, // Twilio WhatsApp number
            to: `whatsapp:${number}`, // Recipient's WhatsApp number
            body: message,
        })
    );

    // Wait for all messages to be sent
    Promise.all(promises)
        .then((results) => {
            console.log('Messages sent:', results.map((msg) => msg.sid));
            res.status(200).send('Messages sent successfully!');
        })
        .catch((error) => {
            console.error('Error sending messages:', error.message);
            res.status(500).send('Failed to send messages.');
        });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
