import models from '../models/user.model.js';
import sgMail from '@sendgrid/mail';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const endpointSecret  = (process.env.STRIPE_WEBHOOK_SECRET)
const JWT_SECRET = (process.env.JWT_SECRET)
const TOKEN_EXPIRY = '168h'; // Adjust as needed
const { parentApplication, studentApplication, contactUsModel, usersModel, transactionsModel } = models;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// login handler
const loginAuth = async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  try {
    const user = await usersModel.findOne({ username });
    console.log("user:", user);
    if (!user) {
      console.log("Invalid username or password");
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch, password, user.password);
    if (!isMatch) {
      console.log('Invalid username or password', typeof password, typeof user.password);
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}
// User Handlers
const getUsers = async (req, res) => {
  console.log('Incoming request to /users');
  try {
    const users = await usersModel.find();
    console.log('Fetched users:', users);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
const addUser = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  try {
    const saltRounds = 10; // The higher the number, the stronger the hash but slower the process
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new usersModel({
      username,
      password: hashedPassword,
    });
    await newUser.save();
    const msg = {
      to: 'alarqamacademy101@gmail.com', 
      from: 'armaggg3@gmail.com', 
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
}
const deleteUser = async (req, res) => {
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
}
//  Contact us methods
const getContactEmails = async (req, res) => {
  console.log('Incoming request to /contact-us');
  try {
    const contacts = await contactUsModel.find();
    console.log('Fetched contacts:', contacts);
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
const addContactEmail = async (req, res) => {
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
}
// student Application Handlers
const getStudentApplication = async (req, res) => {
  console.log('Incoming request to /student-application');
  try {
    const studentApplications = await studentApplication.find();
    console.log('Fetched contacts:', studentApplications);
    res.status(200).json(studentApplications);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
const addStudentApplication = async (req, res) => {
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
    let emailContent = `
      A new application has been submitted:
      <p>Name: ${application.firstName} ${application.lastName}</p>
      <p>Email: ${application.email}</p>
      <p>Phone: ${application.phoneNumber}</p>
      <p>Gender: ${application.gender}</p>
      <p>Address: ${application.address}</p>
      <p>City: ${application.city}</p>
      <p>Zip Code: ${application.zipCode}</p>
      <p>Selected Program: ${application.selectedProgram}</p>
    `;
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
}
// Parent Application Handlers
const getParentApplication = async (req, res) => {
  console.log('Incoming request to /contact-us');
  try {
    const parentApplications = await parentApplication.find();
    console.log('Fetched contacts:', parentApplications);
    res.status(200).json(parentApplications);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
const addParentApplication = async (req, res) => {
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
  if (!application.children || application.children.length < 1) {
    return res.status(400).json({ message: "Parents must register at least one child" });
  }
  const invalidChild = application.children.some(child =>
    !child.firstName || !child.lastName || !child.gender || !child.dob || !child.selectedProgram
  );
  if (invalidChild) {
    return res.status(400).json({ message: "Please fill in all fields for each child" });
  }
  const newApplication = new parentApplication(application);
  try {
    await newApplication.save();
    let emailContent = `
      A new application has been submitted:
      <p>Name: ${application.firstName} ${application.lastName}</p>
      <p>Email: ${application.email}</p>
      <p>Phone: ${application.phoneNumber}</p>
      <p>Address: ${application.address}</p>
      <p>City: ${application.city}</p>
      <p>Zip Code: ${application.zipCode}</p>
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
    const msg = {
      to: 'alarqamacademy101@gmail.com', 
      from: 'armaggg3@gmail.com', 
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
}
// Send Emails Handler
const sendEmail =  async (req, res) => {
  const { emailAddress, emailMessage, emailSubject } = req.body;
  console.log(emailAddress);
  if (!emailAddress || !emailMessage || !emailSubject) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  try {
    console.log(req.body);
    const msg = {
      to: emailAddress, // Receiver's email
      from: 'armaggg3@gmail.com', // Use a verified sender
      subject: `${emailSubject}`,
      text: `${emailMessage}`,
      html: `
              <h1>We will be so happy if you accepted our invitation to this party</h1>
            `,
    };
    console.log("email sending");
    await sgMail.sendMultiple(msg).then((res) => {
      console.log(res);
    }).catch((err) => {
      console.log("error:", err.message);
    });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error saving user or sending email:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
} 
// Payment Handlers
const createPaymentIntent = async (req, res) => {
  const { amount, email, name, phoneNumber } = req.body;
  if (!amount) {
    return res.status(400).json({ message: 'Error No Amount Provided' });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:amount * 100,
      currency: 'usd',
      metadata: {
        email,
        name,
        phone:phoneNumber,
      },
      automatic_payment_methods : {
        enabled: true,
      }
    });
    res.send({clientSecret: paymentIntent.client_secret})
  }catch(e) {
    return req.status(400).send({
      error: {
        message: e.message,
      }
    });
  }
}
// monthly
// Function to create a subscription with a custom monthly amount
const createSubscription = async (req, res) => {
  const { amount, email, name, phoneNumber } = req.body;
  console.log(req.body);
  if (!amount) {
    return res.status(400).json({ message: 'Error: Missing required fields' });
  }
  try {
    // Create a customer
    const customer = await stripe.customers.create({
      email,
      name,
      phone: phoneNumber,
    });
    // Create a product if you don't already have one
    const product = await stripe.products.create({
      name: 'Custom Monthly Subscription',
    });
    // Create a pricing plan
    const price = await stripe.prices.create({
      unit_amount: amount * 100,
      currency: 'usd',
      recurring: { interval: 'month' },
      product: product.id,
    });
    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    res.send({
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
};

// function to get stripe webhooks 
const getPaymentData = async (request, response) => {
  const sig = request.headers['stripe-signature'];
  console.log(`Type of req.body: ${typeof request.body}`);
  if (Buffer.isBuffer(request.body)) {
    console.log(`Raw body (Buffer): ${request.body.toString('utf8')}`);
  } else {
    console.log(`Raw body (not Buffer): ${request.body}`);
  }  try {
    // Verify the signature
    const event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    const { type, data } = event;
    console.log(`Received event: ${type}`);
    // Handle event types
    const metadata = {
      email: data.object.customer_email || '',
      name: data.object.customer_name || '',
      phone: data.object.customer_phone || '', // If phone is not mandatory
    }
    switch (type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = data.object;
        console.log(`PaymentIntent ${paymentIntent} succeeded!`);
        // Save transaction to the database
        await transactionsModel.create({
          customerId: paymentIntent.customer,
          amount: paymentIntent.amount / 100,
          status: 'succeeded',
          metadata,
        });
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = data.object;
        console.log(`Invoice ${invoice.id} payment succeeded!`);
        // Save or update transaction in the database
        const existingTransaction = await transactionsModel.findOne({ subscriptionId: invoice.subscription });
        if (!existingTransaction) {
          await transactionsModel.create({
            customerId: invoice.customer,
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid / 100,
            status: 'succeeded',
            metadata,
          });
        } else {
          await transactionsModel.updateOne(
            { subscriptionId: invoice.subscription },
            { status: 'succeeded' }
          );
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = data.object;
        console.log(`Subscription ${subscription.id} updated to ${subscription.status}`);
        const existingTransaction = await transactionsModel.findOne({ subscriptionId: subscription.id });
        if (!existingTransaction) {
          await transactionsModel.create({
            customerId: subscription.customer,
            subscriptionId: subscription.id,
            amount: subscription.items.data[0].price.unit_amount / 100,
            status: subscription.status,
            metadata,
          });
        } else {
          await transactionsModel.updateOne(
            { subscriptionId: subscription.id },
            { status: subscription.status }
          );
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = data.object;
        console.log(`Subscription ${subscription.id} canceled.`);
        await transactionsModel.updateOne(
          { subscriptionId: subscription.id },
          { status: 'canceled' }
        );
        break;
      }
      default:
        console.log(`Unhandled event type ${type}`);
    }
    response.status(200).send();
  } catch (err) {
    console.error('Error handling webhook event:', err);
    response.status(400).send(`Webhook Error: ${err.message}`);
  }
}
// Get Transactions Data 
const getTransactions = async (req, res) => {
  try {
    const transactions = await transactionModel.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching transactions' });
  }
};
export {
  loginAuth,
  addParentApplication,
  getParentApplication,
  addUser,
  getUsers,
  deleteUser,
  addStudentApplication,
  getStudentApplication,
  addContactEmail,
  getContactEmails,
  sendEmail,
  createPaymentIntent,
  createSubscription,
  getPaymentData,
  getTransactions
};