// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt-nodejs');

// const userSchema = mongoose.Schema({
//   local: {
//     email: String,
//     password: String,
//     phoneNumber: String,
//     name: String,
//     avatar: String
//   },
//   google: {
//     id: String,
//     token: String,
//     name: String,
//     email: String
//   }
// });

// userSchema.methods.generateHash = password =>
//   bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);

// userSchema.methods.validPassword = function(password) {
//     return bcrypt.compareSync(password, this.local.password);
// };



// module.exports = mongoose.model('User', userSchema);
