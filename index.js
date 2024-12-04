import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import cors from 'cors';
import nodemailer from 'nodemailer';
import models from './models/user.model.js';
import sgMail from '@sendgrid/mail';
const { userApplication, contactUsModel, usersModel } = models;
const app = express();
dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// Middleware
app.use(express.json());
// app.use(cors({
//   origin: '*', // Allows all origins during testing. Replace '*' with your frontend URL in production.
// }));
app.use(cors({
  origin: ['http://localhost:3000', 'https://al-arqam-academy.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
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
app.get('/api/users', async (req, res) => {
  console.log('Incoming request to /api/users');
  try {
    const users = await usersModel.find();
    console.log('Fetched contacts:', users);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});
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
app.get('/api/users-application', async (req, res) => {
  console.log('Incoming request to /api/contact-us');
  try {
    const userApplications = await userApplication.find();
    console.log('Fetched contacts:', userApplications);
    res.status(200).json(userApplications);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});

app.post('/api/users', async (req, res) => {
  const data = req.body;
  console.log(data);
  if (!data.username || !data.password ) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  const newUser = new usersModel(data);
  try {
    await newUser.save();
    const msg = {
      to: 'alarqamacademy101@gmail.com', // Receiver's email
      from: 'armaggg3@gmail.com', // Use a verified sender
      subject: 'New user added',
      text: `Name: ${data.username}\nEmail: ${data.password}`,
      html: `
              <h1>Add New User</h1>
              <p>Name: ${data.username}</p>
              <p>Email: ${data.password}</p>
            `
    };
    console.log("email se");
    await sgMail.send(msg)
    .then((res)=>{console.log(res);})
    .catch((err)=>{console.log("error:",err.message);})
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error('Error saving contact or sending email:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
})
app.post('/api/contact-us', async (req, res) => {
  const data = req.body;
  console.log(data);
  if (!data.name || !data.email || !data.message) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  const newContactUs = new contactUsModel(data);
  try {
    await newContactUs.save();
    const msg = {
      to: 'alarqamacademy101@gmail.com', // Receiver's email
      from: 'armaggg3@gmail.com', // Use a verified sender
      subject: 'Contact Us',
      text: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`,
      html: `
              <h1>Contact Us</h1>
              <p>Name: ${data.name}</p>
              <p>Email: ${data.email}</p>
              <p>Message: ${data.message}</p>
            `
    };
    await sgMail.send(msg)
    .then((res)=>{console.log(res);})
    .catch((err)=>{console.log(err.message);})
    // Send the email
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
      <p>Name: ${application.firstName} ${application.lastName}</p>
      <p>Email: ${application.email}</p>
      <p>Phone: ${application.phoneNumber}</p>
      <p>Gender: ${application.gender}</p>
      <p>Address: ${application.address}</p>
      <p>City: ${application.city}</p>
      <p>Zip Code: ${application.zipCode}</p>
    `;
    if (!application.isParent) {
      emailContent += `
        <p>Role: Student</p>
        <p>Date of Birth: ${application.dob}</p>
        <p>Selected Program: ${application.selectedProgram}</p>
      `;
    } else {
      emailContent += `
        <p></p>Role: Parent
        <p></p>Children:
      `;
      application.children.forEach((child, index) => {
        emailContent += `
          <p>Child ${index + 1}:</p>
          <p>Name: ${child.firstName} ${child.lastName}</p>
          <p>Gender: ${child.gender}</p>
          <p>Date of Birth: ${child.dob}</p>
          <p>Selected Program: ${child.selectedProgram}</p>
        `;
      });
    }
    const msg = {
      to: 'alarqamacademy101@gmail.com', // Receiver's email
      from: 'armaggg3@gmail.com', // Use a verified sender
      subject: 'Contact Us',
      text: emailContent,
      html: `
              <h1>New Application</h1>
              ${emailContent}
            `
    };
    await sgMail.send(msg)
    .then((res)=>{console.log(res);})
    .catch((err)=>{console.log(err.message);})
    // const mailOptions = {
    //   from: process.env.EMAIL_USER,
    //   to: 'mostafasonbaty0@gmail.com',
    //   subject: 'New Application Submitted',
    //   text: emailContent,
    // };
    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.error('Error sending email:', error);
    //   } else {
    //     console.log('Email sent:', info.response);
    //   }
    // });
    res.status(201).json({ success: true, data: newApplication });
  } catch (error) {
    console.error("Error in create application:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  console.log("before try",userId);
  try {
    // Find and delete the user by ID
    console.log("before delete",userId);
    const deletedUser = await usersModel.findByIdAndDelete(userId);
    console.log("after delete",userId);
    if (!deletedUser) {
      console.log("user not found log");
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200);
  } catch (error) {
    console.error('Error deleting user:', error);
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

