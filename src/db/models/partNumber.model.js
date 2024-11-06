const mongoose = require('mongoose');

const DEFAULT_FIELDS = [
  {
    fieldName: 'Model Number',
    value: '',
    isChecked: false,
    isRequired: true,
    // maxLength: 20,
    order: -1,
  },
  {
    fieldName: 'Year',
    value: '',
    isChecked: true,
    isRequired: false,
    // maxLength: 4,
    order: 5,
  },
  {
    fieldName: 'Month',
    value: '',
    isChecked: true,
    isRequired: false,
    // maxLength: 2,
    order: 6,
  },
  {
    fieldName: 'Date',
    value: '',
    isChecked: true,
    isRequired: false,
    // maxLength: 2,
    order: 7,
  },
  {
    fieldName: 'PART NO',
    order: 1,
    isChecked: true,
    value: '',
    // maxLength: 10,
    isRequired: true,
  },
  {
    fieldName: 'SUPPLIER CODE',
    order: 2,
    isChecked: true,
    value: '',
    // maxLength: 5,
    isRequired: true,
  },
  {
    fieldName: 'MACHINE NO',
    order: 3,
    isChecked: true,
    value: '',
    // maxLength: 8,
    isRequired: true,
  },
  {
    fieldName: 'Julian Date',
    value: '',
    isChecked: true,
    order: 4,
    // maxLength: 3,
    isRequired: false,
  },
  // {
  //   fieldName: 'Shift',
  //   value: '',
  //   isChecked: true,
  //   order: 9,
  // maxLength: 1,
  //   isRequired: false,
  // },
  {
    fieldName: 'Serial Number',
    order: 8,
    isChecked: true,
    value: '',
    // maxLength: 6,
    isRequired: true,
  },
  {
    fieldName: 'COMPANY CODE',
    order: 9,
    isChecked: true,
    value: '',
    // maxLength: 3,
    isRequired: true,
  },
  {
    fieldName: 'FOR STORE',
    order: 10,
    isChecked: true,
    value: '',
    // maxLength: 4,
    isRequired: false,
  },
  {
    fieldName: 'STORE',
    order: 11,
    isChecked: true,
    value: '',
    // maxLength: 4,
    isRequired: false,
  },
  {
    fieldName: 'Shift',
    order: 12,
    isChecked: true,
    value: '',
    // maxLength: 1,
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

module.exports = {
  PartNumberConfig,
  DEFAULT_FIELDS,
};
