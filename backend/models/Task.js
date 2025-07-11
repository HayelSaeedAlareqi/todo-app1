const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// التحقق مما إذا كان النموذج موجوداً بالفعل قبل تصديره
module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);