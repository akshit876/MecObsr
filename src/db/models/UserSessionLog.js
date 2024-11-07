import mongoose from 'mongoose';

const userSessionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date
  },
  userAgent: String,
  ipAddress: String,
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.models.UserSessionLog || mongoose.model('UserSessionLog', userSessionLogSchema); 