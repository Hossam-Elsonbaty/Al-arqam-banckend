import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import cors from 'cors';
import nodemailer from 'nodemailer';
import models from './models/user.model.js';

const { userApplication, contactUsModel } = models;
const app = express();
dotenv.config();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Allows all origins during testing. Replace '*' with your frontend URL in production.
}));

const PORT = process.env.PORT || 5555;

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

// Routes
app.get('/api/contact-us', async (req, res) => {
  console.log('Incoming request to /api/contact-us');
  try {
    const contacts = await contactUsModel.find();
    console.log('Fetched contacts:', contacts);
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});

app.post('/api/contact-us', async (req, res) => {
  const data = req.body;
  console.log(data);
  if (!data.name || !data.email || !data.message) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  const newContactUs = new contactUsModel(data);
  try {
    await newContactUs.save();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'mostafasonbaty0@gmail.com',
      subject: 'Contact Us',
      text: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
    res.status(201).json({ success: true, data: newContactUs });
  } catch (error) {
    console.error('Error saving contact us data:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});

// Additional POST route logic...

// Start the server only after the DB is connected
const startServer = async () => {
  try {
    await connectDB(); // Wait for DB connection to establish
    console.log('Database connected successfully.');
    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1); // Exit the application if DB connection fails
  }
};

// Start the server
startServer();
