import express from 'express';
// import nodemailer from 'nodemailer';
import models from '../models/user.model.js';
import sgMail from '@sendgrid/mail';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import verifyToken from './middleware.js';
const { parentApplication, studentApplication, contactUsModel, usersModel } = models;
const router = express.Router();

const JWT_SECRET = (process.env.JWT_SECRET)
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
      console.log("Invalid username or password");
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch,password, user.password);
    if (!isMatch) {
      console.log('Invalid match username or password',typeof password, typeof user.password);
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', verifyToken, async (req, res) => {
  console.log('Incoming request to /users');
  try {
    const users = await usersModel.find();
    console.log('Fetched users:', users);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});
router.delete('/users/:id', verifyToken, async (req, res) => {
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
// contact us
router.get('/contact-us', verifyToken, async (req, res) => {
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
// router.get('/users-application', verifyToken, async (req, res) => {
//   console.log('Incoming request to /contact-us');
//   try {
//     const userApplications = await userApplication.find();
//     console.log('Fetched contacts:', userApplications);
//     res.status(200).json(userApplications);
//   } catch (error) {
//     console.error('Error fetching data from database:', error);
//     res.status(500).json({ message: 'Server error, please try again later.' });
//   }
// });
router.get('/student-application', verifyToken, async (req, res) => {
  console.log('Incoming request to /student-application');
  try {
    const studentApplications = await studentApplication.find();
    console.log('Fetched contacts:', studentApplications);
    res.status(200).json(studentApplications);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});
router.get('/parent-application', verifyToken, async (req, res) => {
  console.log('Incoming request to /contact-us');
  try {
    const parentApplications = await parentApplication.find();
    console.log('Fetched contacts:', parentApplications);
    res.status(200).json(parentApplications);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});
router.post('/users', verifyToken, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  try {
    // Hash the password
    const saltRounds = 10; // The higher the number, the stronger the hash but slower the process
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Create a new user object with the hashed password
    const newUser = new usersModel({
      username,
      password: hashedPassword, // Store the hashed password in the database
    });
    await newUser.save();
    const msg = {
      to: 'alarqamacademy101@gmail.com', // Receiver's email
      from: 'armaggg3@gmail.com', // Use a verified sender
      subject: 'New user added',
      text: `Name: ${username}\nPassword: (hashed)`,
      html: `
              <h1>Add New User</h1>
              <p>Name: ${username}</p>
              <p>Password: (hashed)</p>
            `,
    };
    console.log("email sending");
    await sgMail.send(msg).then((res) => {
      console.log(res);
    }).catch((err) => {
      console.log("error:", err.message);
    });
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error('Error saving user or sending email:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
});

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
router.post('/send-email', async (req, res) => {
  const data = req.body;
  console.log(data);
  if (!data.emailAddress || !data.emailMessage || !data.emailSubject) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  try {
    const msg = {
      to: `${data.emailAddress}`, // Receiver's email
      from: 'armaggg3@gmail.com', // Use a verified sender
      subject: `${data.emailSubject}`,
      text: `${data.emailMessage}`,
      html: `
              <h1>Hello from Alarqam Academy</h1>
              <p>We will be so happy if you accepted our invitation to this party</p>            `
    };
    await sgMail.send(msg)
    .then((res)=>{console.log(res);})
    .catch((err)=>{console.log(err.message);})
    // Send the email
    res.status(201);
  } catch (error) {
    console.error('Error saving contact or sending email:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
})
router.post('/student-application', async (req, res) => {
  const application = req.body;
  console.log(application);
  
  if (
    !application.firstName || 
    !application.lastName || 
    !application.email || 
    !application.phoneNumber || 
    !application.address || 
    !application.dob || 
    !application.city || 
    !application.gender || 
    !application.selectedProgram || 
    !application.zipCode
  ) {
    return res.status(400).json({ message: "Please fill in all required fields" });
  }
  const newApplication = new studentApplication(application);
  try {
    await newApplication.save();
    // let emailContent = `
    //   A new application has been submitted:
    //   <p>Name: ${application.firstName} ${application.lastName}</p>
    //   <p>Email: ${application.email}</p>
    //   <p>Phone: ${application.phoneNumber}</p>
    //   <p>Gender: ${application.gender}</p>
    //   <p>Address: ${application.address}</p>
    //   <p>City: ${application.city}</p>
    //   <p>Zip Code: ${application.zipCode}</p>
    // `;
    // if (!application.isParent) {
    //   emailContent += `
    //     <p>Role: Student</p>
    //     <p>Date of Birth: ${application.dob}</p>
    //     <p>Selected Program: ${application.selectedProgram}</p>
    //   `;
    // } else {
    //   emailContent += `
    //     <p></p>Role: Parent
    //     <p></p>Children:
    //   `;
    //   application.children.forEach((child, index) => {
    //     emailContent += `
    //       <p>Child ${index + 1}:</p>
    //       <p>Name: ${child.firstName} ${child.lastName}</p>
    //       <p>Gender: ${child.gender}</p>
    //       <p>Date of Birth: ${child.dob}</p>
    //       <p>Selected Program: ${child.selectedProgram}</p>
    //     `;
    //   });
    // }
    // const msg = {
    //   to: 'alarqamacademy101@gmail.com', // Receiver's email
    //   from: 'armaggg3@gmail.com', // Use a verified sender
    //   subject: 'Contact Us',
    //   text: emailContent,
    //   html: `
    //           <h1>New Application</h1>
    //           ${emailContent}
    //         `
    // };
    // await sgMail.send(msg)
    // .then((res)=>{console.log(res);})
    // .catch((err)=>{console.log(err.message);})
    res.status(201).json({ success: true, data: newApplication });
  } catch (error) {
    console.error("Error in create application:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
// router.post('/users-application', async (req, res) => {
//   const application = req.body;
//   if (
//     !application.firstName || 
//     !application.lastName || 
//     !application.email || 
//     !application.phoneNumber || 
//     !application.address || 
//     !application.city || 
//     !application.zipCode
//   ) {
//     return res.status(400).json({ message: "Please fill in all required fields" });
//   }
//   if (!application.isParent) {
//     if (!application.dob || !application.selectedProgram || !application.gender) {
//       return res.status(400).json({ message: "Students must provide Date of Birth and Selected Program" });
//     }
//   }
//   if (application.isParent) {
//     if (!application.children || application.children.length < 1) {
//       return res.status(400).json({ message: "Parents must register at least one child" });
//     }
//     const invalidChild = application.children.some(child =>
//       !child.firstName || !child.lastName || !child.gender || !child.dob || !child.selectedProgram
//     );
//     if (invalidChild) {
//       return res.status(400).json({ message: "Please fill in all fields for each child" });
//     }
//   }
//   const newApplication = new userApplication(application);
//   try {
//     await newApplication.save();
//     let emailContent = `
//       A new application has been submitted:
//       <p>Name: ${application.firstName} ${application.lastName}</p>
//       <p>Email: ${application.email}</p>
//       <p>Phone: ${application.phoneNumber}</p>
//       <p>Gender: ${application.gender}</p>
//       <p>Address: ${application.address}</p>
//       <p>City: ${application.city}</p>
//       <p>Zip Code: ${application.zipCode}</p>
//     `;
//     if (!application.isParent) {
//       emailContent += `
//         <p>Role: Student</p>
//         <p>Date of Birth: ${application.dob}</p>
//         <p>Selected Program: ${application.selectedProgram}</p>
//       `;
//     } else {
//       emailContent += `
//         <p></p>Role: Parent
//         <p></p>Children:
//       `;
//       application.children.forEach((child, index) => {
//         emailContent += `
//           <p>Child ${index + 1}:</p>
//           <p>Name: ${child.firstName} ${child.lastName}</p>
//           <p>Gender: ${child.gender}</p>
//           <p>Date of Birth: ${child.dob}</p>
//           <p>Selected Program: ${child.selectedProgram}</p>
//         `;
//       });
//     }
//     const msg = {
//       to: 'alarqamacademy101@gmail.com', // Receiver's email
//       from: 'armaggg3@gmail.com', // Use a verified sender
//       subject: 'Contact Us',
//       text: emailContent,
//       html: `
//               <h1>New Application</h1>
//               ${emailContent}
//             `
//     };
//     await sgMail.send(msg)
//     .then((res)=>{console.log(res);})
//     .catch((err)=>{console.log(err.message);})
//     res.status(201).json({ success: true, data: newApplication });
//   } catch (error) {
//     console.error("Error in create application:", error.message);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// });
router.post('/parent-application', async (req, res) => {
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
  const newApplication = new parentApplication(application);
  try {
    await newApplication.save();
    // let emailContent = `
    //   A new application has been submitted:
    //   <p>Name: ${application.firstName} ${application.lastName}</p>
    //   <p>Email: ${application.email}</p>
    //   <p>Phone: ${application.phoneNumber}</p>
    //   <p>Gender: ${application.gender}</p>
    //   <p>Address: ${application.address}</p>
    //   <p>City: ${application.city}</p>
    //   <p>Zip Code: ${application.zipCode}</p>
    // `;
    // if (!application.isParent) {
    //   emailContent += `
    //     <p>Role: Student</p>
    //     <p>Date of Birth: ${application.dob}</p>
    //     <p>Selected Program: ${application.selectedProgram}</p>
    //   `;
    // } else {
    //   emailContent += `
    //     <p></p>Role: Parent
    //     <p></p>Children:
    //   `;
    //   application.children.forEach((child, index) => {
    //     emailContent += `
    //       <p>Child ${index + 1}:</p>
    //       <p>Name: ${child.firstName} ${child.lastName}</p>
    //       <p>Gender: ${child.gender}</p>
    //       <p>Date of Birth: ${child.dob}</p>
    //       <p>Selected Program: ${child.selectedProgram}</p>
    //     `;
    //   });
    // }
    // const msg = {
    //   to: 'alarqamacademy101@gmail.com', // Receiver's email
    //   from: 'armaggg3@gmail.com', // Use a verified sender
    //   subject: 'Contact Us',
    //   text: emailContent,
    //   html: `
    //           <h1>New Application</h1>
    //           ${emailContent}
    //         `
    // };
    // await sgMail.send(msg)
    // .then((res)=>{console.log(res);})
    // .catch((err)=>{console.log(err.message);})
    res.status(201).json({ success: true, data: newApplication });
  } catch (error) {
    console.error("Error in create application:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router
// module.exports = router;
