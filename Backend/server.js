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

// Webhook for receiving messages
app.post('/webhook', (req, res) => {
    const from = req.body.From; // Sender's WhatsApp number
    const messageBody = req.body.Body; // Message content

    if (!from || !messageBody) {
        console.error('Invalid request payload:', req.body);
        return res.status(400).send('Invalid request payload.');
    }

    console.log(`Message received from ${from}: ${messageBody}`);

    // Prepare a reply based on the incoming message
    let reply;
    if (messageBody.toLowerCase() === 'hello') {
        reply = "Hi there! How can I help you today?";
    } else if (messageBody.toLowerCase() === 'status') {
        reply = "Your application status is: Approved ✅";
    } else {
        reply = "Sorry, I didn't understand that. Please type 'hello' or 'status' for assistance.";
    }

    // Send the reply to the sender
    client.messages
        .create({
            from: from, // Twilio WhatsApp number
            to: twilioWhatsAppNumber, // Respond to the sender's WhatsApp number
            body: reply,
        })
        .then((message) => {
            console.log(`Message sent to ${from} with SID: ${message.sid}`);
            res.status(200).send('Reply sent successfully!');
        })
        .catch((error) => {
            console.error('Error sending reply:', error.message);
            res.status(500).send('Failed to send reply.');
        });
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
