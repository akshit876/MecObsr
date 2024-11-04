import mongoose from 'mongoose';

const shiftConfigSchema = new mongoose.Schema({
  shifts: [{
    shiftNumber: Number,
    startTime: String,
    duration: Number,
    shiftCode: {
      type: String,
      maxLength: 1,
      match: /^[A-Za-z]$/
    }
  }],
  totalHours: {
    type: Number,
    validate: {
      validator: function(value) {
        return value === 24;
      },
      message: 'Total shift duration must equal 24 hours'
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.ShiftConfig || mongoose.model('ShiftConfig', shiftConfigSchema); 