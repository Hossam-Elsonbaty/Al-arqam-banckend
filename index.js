import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import cors from 'cors';
import nodemailer from 'nodemailer';
import models from './models/user.model.js';

const { userApplication, contactUsModel } = models;
dotenv.config()
const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 5000;
// Serve static files from React build directory
app.use(express.static(path.join(__dirname, '../build')));

// API routes
app.get('/api/hello', (req, res) => {
  res.json({ message: "Hello from API!" });
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});
const transporter = nodemailer.createTransport({
  service: 'Gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});
app.post ('/api/contact-us', async (req, res) => {
  const data = req.body;
  console.log(data);
  if(
    !data.name || 
    !data.email || 
    !data.message
  ){
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  const newContactUs = new contactUsModel(data);
  try {
    await newContactUs.save()
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
  } 
  catch{
    console.error('Error sending email:', error);
    return res.status(500).json({ message: 'Server error, please try again later.' });
  }
})
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

app.listen(PORT, () => {
  connectDB();
  console.log(`App is listening to port`);
});
