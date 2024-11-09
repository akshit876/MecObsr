import mongoose from 'mongoose';

const recordSchema = new mongoose.Schema({
  SerialNumber: String,
  MarkingData: String,
  ScannerData: String,
  Result: String,
  User: String,
  Timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Record = mongoose.models.Record || mongoose.model('Record', recordSchema);

export default Record; 