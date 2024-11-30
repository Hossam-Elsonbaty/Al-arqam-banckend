import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import cors from 'cors';
import nodemailer from 'nodemailer';
import models from './models/user.model.js';
import sgMail from '@sendgrid/mail';
const { userApplication, contactUsModel } = models;
const app = express();
dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
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
  console.log("data saved in db");
  try {
    await newContactUs.save();
    // SendGrid email options
    const msg = {
      to: 'mostafasonbaty0@gmail.com', // Receiver's email
      from: 'example@yourdomain.com', // Use a verified sender
      subject: 'Contact Us',
      text: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`,
    };
    await sgMail.send(msg); // Send the email
    res.status(201).json({ success: true, data: newContactUs });
  } catch (error) {
    console.error('Error saving contact or sending email:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
  // try {
  //   const mailOptions = {
  //     from: 'armaggg3@gmail.com',
  //     to: 'mostafasonbaty0@gmail.com',
  //     subject: 'Contact Us',
  //     text: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`
  //   };
  //   transporter.sendMail(mailOptions, (error, info) => {
  //     console.log("opened transporter.sendMail")
  //     if (error) {
  //       console.error('Error sending email:', error);
  //     } else {
  //       console.log('Email sent:', info.response);
  //     }
  //   });
  //   res.status(201).json({ success: true, data: newContactUs });
  // } catch (error) {
  //   console.error('Error saving contact us data:', error);
  //   res.status(500).json({ message: 'Server error, please try again later.' });
  // }
});
app.post('/api/users-application', async (req, res) => {
  const application = req.body;
  if (
    !application.firstName || 
    !application.lastName || 
    !application.email || 
    !application.phoneNumber || 
    !application.address || 
    !application.city || 
    !application.zipCode
  ) {
    return res.status(400).json({ message: "Please fill in all required fields" });
  }
  if (!application.isParent) {
    if (!application.dob || !application.selectedProgram || !application.gender) {
      return res.status(400).json({ message: "Students must provide Date of Birth and Selected Program" });
    }
  }
  if (application.isParent) {
    if (!application.children || application.children.length < 1) {
      return res.status(400).json({ message: "Parents must register at least one child" });
    }
    const invalidChild = application.children.some(child =>
      !child.firstName || !child.lastName || !child.gender || !child.dob || !child.selectedProgram
    );
    if (invalidChild) {
      return res.status(400).json({ message: "Please fill in all fields for each child" });
    }
  }
  const newApplication = new userApplication(application);
  try {
    await newApplication.save();
    let emailContent = `
      A new application has been submitted:
      Name: ${application.firstName} ${application.lastName}
      Email: ${application.email}
      Phone: ${application.phoneNumber}
      Gender: ${application.gender}
      Address: ${application.address}
      City: ${application.city}
      Zip Code: ${application.zipCode}
    `;
    if (!application.isParent) {
      emailContent += `
        Role: Student
        Date of Birth: ${application.dob}
        Selected Program: ${application.selectedProgram}
      `;
    } else {
      emailContent += `
        Role: Parent
        Children:
      `;
      application.children.forEach((child, index) => {
        emailContent += `
          Child ${index + 1}:
          Name: ${child.firstName} ${child.lastName}
          Gender: ${child.gender}
          Date of Birth: ${child.dob}
          Selected Program: ${child.selectedProgram}
        `;
      });
    }
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'mostafasonbaty0@gmail.com',
      subject: 'New Application Submitted',
      text: emailContent,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
    res.status(201).json({ success: true, data: newApplication });
  } catch (error) {
    console.error("Error in create application:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
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
