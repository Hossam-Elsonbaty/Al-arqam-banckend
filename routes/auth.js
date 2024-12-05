import express from 'express';
// import nodemailer from 'nodemailer';
import models from '../models/user.model.js';
import sgMail from '@sendgrid/mail';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { userApplication, contactUsModel, usersModel } = models;
// const express = require('express');
// const User = require('../models/userModel'); // Replace with your user model
const router = express.Router();

const JWT_SECRET = 'c6b3685154bf81ec26319af30b6d6a3a05eccd59709b325ae16c0f4305a0f0390eba43e816b3f70f74b70a6b1a7abde30f88ea56e5a835ff20675f2f563744e9'; // Replace with your own secret key
const TOKEN_EXPIRY = '168h'; // Adjust as needed
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  try {
    const user = await usersModel.findOne({ username });
    console.log("user:",user);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};
// Routes
router.get('/users', async (req, res) => {
  console.log('Incoming request to /users');
  try {
    const users = await usersModel.find();
    console.log('Fetched contacts:', users);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});
router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const deletedUser = await usersModel.findByIdAndDelete(userId);
    if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});
router.get('/contact-us', async (req, res) => {
  console.log('Incoming request to /contact-us');
  try {
    const contacts = await contactUsModel.find();
    console.log('Fetched contacts:', contacts);
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});
router.get('/users-application', async (req, res) => {
  console.log('Incoming request to /contact-us');
  try {
    const userApplications = await userApplication.find();
    console.log('Fetched contacts:', userApplications);
    res.status(200).json(userApplications);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});

router.post('/users', async (req, res) => {
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
router.post('/contact-us', async (req, res) => {
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
})
router.post('/users-application', async (req, res) => {
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
    res.status(201).json({ success: true, data: newApplication });
  } catch (error) {
    console.error("Error in create application:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// Example of a protected route
router.get('/dashboard', verifyToken, (req, res) => {
  res.json({ message: 'Welcome to the dashboard!' });
});
export default router
// module.exports = router;
