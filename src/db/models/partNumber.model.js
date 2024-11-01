const mongoose = require('mongoose');

const DEFAULT_FIELDS = [
  {
    fieldName: 'PART NO',
    order: 1,
    isChecked: true,
    value: '',
    maxLength: 10,
    isRequired: true,
  },
  {
    fieldName: 'SUPPLIER CODE',
    order: 2,
    isChecked: true,
    value: '',
    maxLength: 5,
    isRequired: true,
  },
  {
    fieldName: 'MACHINE NO',
    order: 3,
    isChecked: true,
    value: '',
    maxLength: 8,
    isRequired: true,
  },
  {
    fieldName: 'JULIAN DATE',
    order: 4,
    isChecked: true,
    value: '',
    maxLength: 3,
    isRequired: true,
  },
  {
    fieldName: 'YEAR',
    order: 5,
    isChecked: true,
    value: '',
    maxLength: 2,
    isRequired: true,
  },
  {
    fieldName: 'DATE',
    order: 6,
    isChecked: true,
    value: '',
    maxLength: 2,
    isRequired: true,
  },
  {
    fieldName: 'MONTH',
    order: 7,
    isChecked: true,
    value: '',
    maxLength: 2,
    isRequired: true,
  },
  {
    fieldName: 'SERIAL NO',
    order: 8,
    isChecked: true,
    value: '',
    maxLength: 6,
    isRequired: true,
  },
  {
    fieldName: 'COMPANY CODE',
    order: 9,
    isChecked: true,
    value: '',
    maxLength: 3,
    isRequired: true,
  },
  {
    fieldName: 'FOR STORE',
    order: 10,
    isChecked: true,
    value: '',
    maxLength: 4,
    isRequired: false,
  },
  {
    fieldName: 'STORE',
    order: 11,
    isChecked: true,
    value: '',
    maxLength: 4,
    isRequired: false,
  },
  {
    fieldName: 'SHIFT',
    order: 12,
    isChecked: true,
    value: '',
    maxLength: 1,
    isRequired: true,
  },
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
    min: 1,
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
          const orders = fields.map((f) => f.order);
          return new Set(orders).size === orders.length;
        },
        message: 'Field orders must be unique',
      },
    },
  },
  {
    timestamps: true,
  },
);

const PartNumberConfig =
  mongoose?.models?.PartNumberConfig || mongoose?.model('PartNumberConfig', PartNumberConfigSchema);

module.exports = {
  PartNumberConfig,
  DEFAULT_FIELDS,
};
