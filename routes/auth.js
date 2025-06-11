
import express from 'express';
import verifyToken from './middleware.js';
import {
  loginAuth,
  addParentApplication,
  getParentApplication,
  addUser,
  getUsers,
  deleteUser,
  addStudentApplication,
  getStudentApplication,
  getContactEmails,
  addContactEmail,
  sendEmail,
  createPaymentIntent,
  createSubscription,
  getPaymentData,
  getTransactions,
  getStatics
} from '../controllers/controllers.js' 
import cors from 'cors';
const corsOptions = {
  origin: ['https://al-arqam-academy.vercel.app', 
  'https://alarqam-academy-dashboard.vercel.app',
  'https://dashboard.alarqamacademy.org',
  'http://localhost:3000',
  'https://alarqamacademy.org','https://www.alarqamacademy.org'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*',
};

const router = express.Router();

router.post('/login',loginAuth );

router.route('/users')
  .get( verifyToken, getUsers)
  .post( verifyToken, addUser);
router.delete('/users/:id', verifyToken, deleteUser);

router.route('/contact-us')
  .get( verifyToken, getContactEmails)
  .post( addContactEmail)

router.route('/student-application')
.get( verifyToken, getStudentApplication)
.post( addStudentApplication);

router.route('/parent-application')
.get(verifyToken, getParentApplication)
.post(addParentApplication);

router.post('/send-email', verifyToken, sendEmail);

// Handle OPTIONS (Preflight) for /create-new-payment
router.options('/create-new-payment', cors(corsOptions), (req, res) => {
  res.status(200).send();
});

// Main POST endpoint
router.post(
  '/create-new-payment',
  cors(corsOptions), // Apply CORS middleware
  createPaymentIntent // Your Stripe logic
);

router.post('/create-new-payment', createPaymentIntent);
router.post('/create-subscription', createSubscription);

router.post('/webhook', express.raw({ type: 'application/json' }), getPaymentData);
router.get('/transactions',verifyToken ,  getTransactions);

router.get('/statics',verifyToken ,  getStatics);

export default router
