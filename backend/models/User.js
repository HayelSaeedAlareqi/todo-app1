const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

// التحقق مما إذا كان النموذج موجوداً بالفعل قبل تصديره
module.exports = mongoose.models.User || mongoose.model('User', userSchema);