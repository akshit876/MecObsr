import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  shiftId: String,
  name: String,
  startTime: String,
  endTime: String,
  duration: Number
});

const shiftConfigSchema = new mongoose.Schema({
  shifts: [shiftSchema],
  totalHours: Number
}, {
  timestamps: true
});

export default mongoose.models.ShiftConfig || mongoose.model('ShiftConfig', shiftConfigSchema); 