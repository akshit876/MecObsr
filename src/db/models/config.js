import { Schema } from 'mongoose';

const configSchema = new Schema(
  {
    partNo: {
      type: String,
      required: true,
    },
  },
  { collection: 'configs' }, // Specify the collection name
);

export default configSchema;
