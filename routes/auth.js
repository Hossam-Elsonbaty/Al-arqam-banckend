
import express from 'express';
import verifyToken from './middleware.js';
import bodyParser from 'body-parser';

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
  getTransactions
} from '../controllers/controllers.js' 
console.log();

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

router.post('/create-new-payment', createPaymentIntent);
router.post('/create-subscription', createSubscription);

router.post('/webhook', bodyParser.raw({ type: 'application/json' }), getPaymentData);
router.get('/transactions', getTransactions);

export default router
