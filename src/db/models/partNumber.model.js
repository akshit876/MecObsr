import mongoose from 'mongoose';

const DEFAULT_FIELDS = [
  {
    fieldName: 'Identification installation location / barcode',
    value: '',
    isChecked: false,
    order: 1,
    maxLength: 10,
  },
  {
    fieldName: 'Part number according to GS 90019 (alphanumeric)',
    value: '',
    isChecked: false,
    order: 2,
    maxLength: 20,
  },
  {
    fieldName: 'Change index according to GS 91005-8',
    value: '',
    isChecked: false,
    order: 3,
    maxLength: 5,
  },
  { fieldName: 'Production year', value: '', isChecked: false, order: 4, maxLength: 4 },
  { fieldName: 'Character of manufacturer', value: '', isChecked: false, order: 5, maxLength: 1 },
  { fieldName: 'Day of production year', value: '', isChecked: false, order: 6, maxLength: 3 },
  { fieldName: 'Assembly line/location', value: '', isChecked: false, order: 7, maxLength: 5 },
  {
    fieldName: 'Day production counter (Serial number)',
    value: '',
    isChecked: false,
    order: 8,
    maxLength: 6,
  },
  {
    fieldName: 'Supplier number according to GS 91001',
    value: '',
    isChecked: false,
    order: 9,
    maxLength: 10,
  },
  {
    fieldName: 'Supplier location address according to GS 91001',
    value: '',
    isChecked: false,
    order: 10,
    maxLength: 10,
  },
  { fieldName: 'Buffer 1', value: '', isChecked: false, order: 11, maxLength: 10 },
  { fieldName: 'Buffer 2', value: '', isChecked: false, order: 12, maxLength: 10 },
  { fieldName: 'Buffer 3', value: '', isChecked: false, order: 13, maxLength: 10 },
  { fieldName: 'Buffer 4', value: '', isChecked: false, order: 14, maxLength: 10 },
  { fieldName: 'Buffer 5', value: '', isChecked: false, order: 15, maxLength: 10 },
];

const PartNumberFieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    required: true,
    min: [-1, 'Order must be -1 or greater than 0'],
    validate: {
      validator: function (v) {
        return v === -1 || v > 0;
      },
      message: 'Order must be -1 for inactive fields or greater than 0 for active fields',
    },
  },
  isChecked: {
    type: Boolean,
    default: true,
  },
  value: {
    type: String,
    default: '',
  },
  maxLength: {
    type: Number,
    required: false,
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
});

const PartNumberConfigSchema = new mongoose.Schema(
  {
    fields: {
      type: [PartNumberFieldSchema],
      default: DEFAULT_FIELDS,
      validate: {
        validator: function (fields) {
          const activeOrders = fields.filter((f) => f.order > 0).map((f) => f.order);

          return new Set(activeOrders).size === activeOrders.length;
        },
        message: 'Active field orders must be unique',
      },
    },
  },
  {
    timestamps: true,
  },
);

const PartNumberConfig =
  mongoose?.models?.PartNumberConfig || mongoose?.model('PartNumberConfig', PartNumberConfigSchema);

export { PartNumberConfig, DEFAULT_FIELDS };
