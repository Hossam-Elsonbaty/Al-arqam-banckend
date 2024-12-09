import mongoose from 'mongoose';

const parentApplicationSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String,
  address: String,
  city: String,
  zipCode: Number,
  children: [
    {
      firstName: String,
      lastName: String,
      gender: String,
      dob: String,
      selectedProgram: String,
    },
  ],
});
const studentApplicationSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String,
  gender: String, 
  dob: String,
  address: String,
  city: String,
  zipCode: Number,
  selectedProgram: String,
});
const contactUsSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
});
const usersSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const models = {
  parentApplication: mongoose.model('parentApplicationSchema',parentApplicationSchema),
  studentApplication : mongoose.model('studentApplication',studentApplicationSchema),
  contactUsModel : mongoose.model('contactUsModel',contactUsSchema),
  usersModel : mongoose.model('usersModel',usersSchema)
}
export default models
