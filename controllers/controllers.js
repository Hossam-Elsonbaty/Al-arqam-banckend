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
  try {
    const user = await usersModel.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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
  try {
    const users = await usersModel.find({ superuser: false });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
const addUser = async (req, res) => {
  const { username, password, isSuperuser  } = req.body;
  if (!username || !password || isSuperuser) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  try {
    const saltRounds = 10; // The higher the number, the stronger the hash but slower the process
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new usersModel({
      username,
      password: hashedPassword,
      superuser: isSuperuser || false
    });
    await newUser.save();
    const msg = {
      to: 'info@alarqamacademy.org', 
      from: 'info@alarqamacademy.org', 
      subject: 'New user added',
      text: `Name: ${username}\nPassword: (hashed)`,
      html: `
              <h1>Add New User</h1>
              <p>Name: ${username}</p>
              <p>Password: (hashed)</p>
            `,
    };
    await sgMail.send(msg).then((res) => {
    }).catch((err) => {
      console.log("error:", err.message);
    });
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
const deleteUser = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await usersModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.superuser) {
      return res.status(403).json({ message: 'Cannot delete superuser' });
    }
    await usersModel.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
//  Contact us methods
const getContactEmails = async (req, res) => {
  try {
    const contacts = await contactUsModel.find();
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
const addContactEmail = async (req, res) => {
  const data = req.body;
  const subject = 'Inquiry Received'
  const msg = 'Salam Alaikum!\nThanks for reaching out to AlArqam Academy! A member of our team will get in touch with you soon regarding your inquiry and message.'
  const footer = `Best Wishes,\nAlArqam Academy Team`
  if (!data.name || !data.email || !data.message) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  const newContactUs = new contactUsModel(data);
  try {
    await newContactUs.save();
    await sendThankYouEmail(data.email, msg, footer,subject)
    const msg2 = {
      to: 'info@alarqamacademy.org', // Receiver's email
      from: 'info@alarqamacademy.org', // Use a verified sender
      subject: 'Contact Us',
      text: `Name: ${data.name}\nEmail: ${data.email}\nMessage: ${data.message}`,
      html: `
              <h1>Contact Us</h1>
              <p>Name: ${data.name}</p>
              <p>Email: ${data.email}</p>
              <p>Message: ${data.message}</p>
            `
    };
    await sgMail.send(msg2)
    .then((res)=>{console.log(res);})
    .catch((err)=>{console.log(err.message);})
    res.status(201).json({ success: true, data: newContactUs });
  } catch (error) {
    console.error('Error saving contact or sending email:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
// student Application Handlers
const getStudentApplication = async (req, res) => {
  try {
    const studentApplications = await studentApplication.find();
    res.status(200).json(studentApplications);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
const addStudentApplication = async (req, res) => {
  const application = req.body;
  const subject = 'Application Received'
  const msg = 'Salam Alaikum! \nThanks for your interest in our programs! This email is to confirm your application submission to AlArqam Academy. Our team will review your application and contact you soon with more details and the next steps in the application process.'
  const footer = `Sincerely,\nAlArqam Academy Team`
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
    await sendThankYouEmail(application.email, msg, footer,subject)
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
    const msg2 = {
      to: 'info@alarqamacademy.org', // Receiver's email
      from:{
        name: 'AlArqam Academy',
        email: 'info@alarqamacademy.org'
      },
      subject: 'Contact Us',
      text: emailContent,
      html: `
              <h1>New Application</h1>
              ${emailContent}
            `
    };
    await sgMail.send(msg2)
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
  try {
    const parentApplications = await parentApplication.find();
    res.status(200).json(parentApplications);
  } catch (error) {
    console.error('Error fetching data from database:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
}
const addParentApplication = async (req, res) => {
  const application = req.body;
  const subject = 'Application Received'
  const msg = 'Salam Alaikum! \nThanks for your interest in our programs! This email is to confirm your application submission to AlArqam Academy. Our team will review your application and contact you soon with more details and the next steps in the application process.'
  const footer = `Sincerely,\nAlArqam Academy Team`
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
    await sendThankYouEmail(application.email, msg, footer,subject)
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
    const msg2 = {
      to: 'info@alarqamacademy.org', 
      from:{
        name: 'AlArqam Academy',
        email: 'info@alarqamacademy.org'
      },
      subject: 'Contact Us',
      text: emailContent,
      html: `
              <h1>New Application</h1>
              ${emailContent}
            `
    };
    await sgMail.send(msg2)
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
  if (!emailAddress || !emailMessage || !emailSubject) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  try {
    const msg = {
      to: emailAddress, // Receiver's email
      from:{
        name: 'AlArqam Academy',
        email: 'info@alarqamacademy.org'
      },
      subject: `${emailSubject}`,
      text: `${emailMessage}`,
    };
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
  const { amount, email, name, phoneNumber} = req.body;
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
    return res.status(400).send({
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
  const subject = 'Thank You for Your Generous Donation'
  const msg = 'Many people say they want to help; fewer actually step up to do it. Thank you and may God reward you for supporting our journey to make a difference for future generations! Your generous contributions sustain our programs!'
  const footer = `Sincerely,\n AlArqam Academy Team`
  const sig = request.headers['stripe-signature'];
  if (Buffer.isBuffer(request.body)) {
    console.log(`Raw body (Buffer): ${request.body.toString('utf8')}`);
  } else {
    console.log(`Raw body (not Buffer): ${request.body}`);
  }  try {
    const event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    const { type, data } = event;
    const metadata = {
      email: data.object.customer_email || '',
      name: data.object.customer_name || '',
      phone: data.object.customer_phone || '', 
    }
    switch (type) {
      case 'charge.updated': {
        const charge = event.data.object;
        const subscriptionId = charge.subscriptionId || `charge_${charge.id}`;
        if (charge.status === 'succeeded') {
          await sendThankYouEmail(charge.billing_details.email || charge.metadata.email, msg, footer,subject)
          await transactionsModel.create({
            subscriptionId: subscriptionId,
            chargeId: charge.id,
            amount: charge.amount / 100,
            currency: charge.currency,
            status: charge.status,
            metadata: {
              email: charge.billing_details.email || charge.metadata.email || '',
              name: charge.billing_details.name || charge.metadata.name || '',
              phone: charge.billing_details.phone || charge.metadata.phone || '',
            },
            receipt_url: charge.receipt_url,
          });
        }
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = data.object;
        await sendThankYouEmail(data.object.customer_email, msg, footer,subject)
        await transactionsModel.create({
          customerId: paymentIntent.customer || null,
          amount: paymentIntent.amount / 100,
          status: 'succeeded',
          metadata,
        });
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = data.object;
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
    const transactions = await transactionsModel.find().sort({ createdAt: -1 });
    res.json(transactions);
    console.log(transactions);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching transactions' });
  }
};
const sendThankYouEmail = async (email, msg, footer, subject) => {
  await sgMail.send({
    to: email,
    from:{
      name: 'AlArqam Academy',
      email: 'info@alarqamacademy.org'
    },
    subject: subject,
    text: `${msg}\n\n${footer}`,
  })
  .then((res)=>{console.log(res);})
  .catch((err)=>{console.log(err.message);})
};
// Get Statics 
const getStatics = async (req, res) => {
  try {
    const transactions = await transactionsModel.find().sort({ createdAt: -1 });
    const parentApplications = await parentApplication.find();
    const studentApplications = await studentApplication.find();
    const Emails = await contactUsModel.find();
    
    const totalApplications = studentApplications.length + parentApplications.length;
    const totalEmails = Emails.length;
    
    const donationsAmount = transactions.reduce((total, transaction) => total + transaction.amount, 0);
    
    res.json({ totalApplications, totalEmails, donationsAmount });
    console.log(parentApplications.length);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send({ message: 'Error Fetching Data' });
  }
};

export {
  loginAuth,
  getStatics,
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