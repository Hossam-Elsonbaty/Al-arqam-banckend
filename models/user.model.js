import mongoose from 'mongoose';

const userApplicationSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phoneNumber: String,
  gender: { type: String, required: function() { return !this.isParent; } },
  dob: { type: String, required: function() { return !this.isParent; } },
  address: String,
  city: String,
  zipCode: Number,
  selectedProgram: { type: String, required: function() { return !this.isParent; } },
  isParent: Boolean,
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
const contactUsSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
});
const models = {
  userApplication : mongoose.model('userApplication',userApplicationSchema),
  contactUsModel : mongoose.model('contactUsModel',contactUsSchema)
}
export default models
