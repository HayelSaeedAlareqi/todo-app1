const mongoose = require('mongoose');

const connectDB = async (mongoURI) => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ تم الاتصال بقاعدة البيانات');
  } catch (err) {
    console.error('❌ فشل الاتصال:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;