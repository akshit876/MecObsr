'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Copy, Edit, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { DEFAULT_FIELDS } from '../../db/models/partNumber.model';
import React from 'react';

export default function PartNumberConfig() {
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [fields, setFields] = useState(DEFAULT_FIELDS.map((field) => ({ ...field })));
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [yearFormat, setYearFormat] = useState('short');
  console.log('DEFAULT_FIELDS', DEFAULT_FIELDS);
  console.log({ dialogOpen });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/part-number-config');
      const data = await response.json();
      setConfigs(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error('Failed to load configurations');
    }
  };

  // Debug log to check fields state
  console.log('Current Fields:', fields);

  const toggleField = (fieldName) => {
    console.log('Toggling field:', fieldName); // Debug log

    setFields((prevFields) => {
      const newFields = prevFields.map((field) => {
        if (field.fieldName === fieldName) {
          console.log('Found field to toggle:', field.fieldName); // Debug log
          return { ...field, isChecked: !field.isChecked };
        }
        return field;
      });
      console.log('Updated fields:', newFields); // Debug log
      return newFields;
    });
  };

  const updateFieldValue = (index, value) => {
    const field = fields[index];

    // Skip if trying to edit read-only date fields
    if (['Year', 'Month', 'Date'].includes(field.fieldName)) {
      return;
    }

    // Check max length
    if (field.maxLength && value.length > field.maxLength) {
      return;
    }

    // Update single field directly instead of mapping entire array
    setFields((prevFields) => {
      const newFields = [...prevFields];
      newFields[index] = { ...field, value };
      return newFields;
    });
  };

  const saveConfig = async () => {
    try {
      // Check if Model Number is filled
      const modelNumber = fields.find((f) => f.fieldName === 'Model Number');
      if (!modelNumber?.value) {
        toast.error('Model Number is required');
        return;
      }

      // Prepare fields for saving
      const fieldsToSave = fields.map((field) => {
        // For Model Number
        if (field.fieldName === 'Model Number') {
          return {
            ...field,
            order: 999,
            isChecked: false,
            isRequired: true, // Ensure it's marked as required
          };
        }

        // For unchecked fields
        if (!field.isChecked) {
          return {
            ...field,
            order: 999,
          };
        }

        // For checked fields, keep their order
        return field;
      });

      const response = await fetch('/api/part-number-config', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedConfig?._id,
          fields: fieldsToSave,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save configuration');
      }

      await loadConfigs();
      setIsEditing(false);
      setSelectedConfig(null);
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message);
    }
  };

  const handleEdit = (config) => {
    setSelectedConfig(config);
    setFields(config.fields);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/part-number-config/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete configuration');

      await loadConfigs();
      toast.success('Configuration deleted successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const generatePartNumber = (configFields) => {
    return configFields
      .filter((field) => field.isChecked && field.order > 0) // Only include fields with positive order
      .sort((a, b) => a.order - b.order)
      .map((field) => field.value)
      .join('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Part number copied to clipboard');
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDialogClose = () => {
    setDialogOpen(false);
    setFields([]);
    setSelectedConfig(null);
    setIsEditing(false);
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDialogOpenChange = (open) => {
    setDialogOpen(open);
    if (open) {
      setSelectedConfig(null);
      setFields(DEFAULT_FIELDS.map((field) => ({ ...field })));
      setIsEditing(false);
    } else {
      setFields([]);
      setSelectedConfig(null);
      setIsEditing(false);
    }
  };

  const updateOrder = (index, newOrder) => {
    const numericOrder = parseInt(newOrder);

    if (newOrder === '') {
      return; // Allow empty temporary state
    }

    if (isNaN(numericOrder) || numericOrder < 1) {
      toast.error('Please enter a number greater than 0');
      return;
    }

    // Check if order already exists in other fields
    const orderExists = fields.some((field, i) => i !== index && field.order === numericOrder);

    if (orderExists) {
      toast.error('This order number is already in use');
      return;
    }

    setFields((prevFields) => {
      const newFields = [...prevFields];
      newFields[index] = { ...newFields[index], order: numericOrder };
      return newFields;
    });
  };

  // Sort fields by order for display
  const sortedFields = [...fields].sort((a, b) => {
    // Handle empty or invalid orders
    if (a.order === '') return 1;
    if (b.order === '') return -1;
    return a.order - b.order;
  });

  // Function to get current date values
  const getCurrentDateValues = () => {
    const now = new Date();
    const year =
      yearFormat === 'short'
        ? now.getFullYear().toString().slice(-2)
        : now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const date = now.getDate().toString().padStart(2, '0');
    return { year, month, date };
  };

  // Function to update date fields
  const updateDateFields = () => {
    const { year, month, date } = getCurrentDateValues();

    const updatedFields = fields.map((field) => {
      switch (field.fieldName) {
        case 'Year':
          return {
            ...field,
            value: year,
            order: 5,
            isChecked: true,
          };
        case 'Month':
          return {
            ...field,
            value: month,
            order: 6,
            isChecked: true,
          };
        case 'Date':
          return {
            ...field,
            value: date,
            order: 7,
            isChecked: true,
          };
        default:
          return field;
      }
    });

    setFields(updatedFields);
  };

  // Call updateDateFields on initial load and when yearFormat changes
  useEffect(() => {
    updateDateFields();
  }, [yearFormat]);

  // Also call updateDateFields when component mounts
  useEffect(() => {
    updateDateFields();
  }, []);

  // Render fields separately from model number
  const renderFields = () => {
    const displayFields = fields.filter((field) => field.fieldName !== 'Model Number');

    return displayFields.map((field) => (
      <div
        key={field.fieldName}
        className="grid grid-cols-[1fr,80px,80px] gap-4 items-center py-2 border-b border-gray-200"
      >
        <div className="flex items-center gap-4">
          <span className="font-medium w-[150px]">
            {field.fieldName}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </span>
          <Input
            value={field.value}
            onChange={(e) => {
              const index = fields.findIndex((f) => f.fieldName === field.fieldName);
              updateFieldValue(index, e.target.value);
            }}
            className={`h-8 ${['Year', 'Month', 'Date'].includes(field.fieldName) ? 'bg-gray-100' : ''}`}
            placeholder={`Max ${field.maxLength} chars`}
            readOnly={['Year', 'Month', 'Date'].includes(field.fieldName)}
            maxLength={field.maxLength}
          />
        </div>
        <div className="flex justify-center items-center">
          <Checkbox
            checked={field.isChecked}
            onCheckedChange={() => {
              console.log('Checkbox clicked for:', field.fieldName); // Debug log
              toggleField(field.fieldName);
            }}
            className="h-5 w-5 border-2 rounded-sm"
          />
        </div>
        <div className="flex justify-center items-center">
          <Input
            type="text"
            value={field.order}
            onChange={(e) => {
              const index = fields.findIndex((f) => f.fieldName === field.fieldName);
              updateOrder(index, e.target.value);
            }}
            className="w-16 h-8 text-center"
            placeholder="#"
          />
        </div>
      </div>
    ));
  };

  // Add a helper function to get Model Number
  const getModelNumber = (configFields) => {
    const modelNumberField = configFields.find((f) => f.fieldName === 'Model Number');
    return modelNumberField?.value || '';
  };

  return (
    <main className="h-screen bg-gray-100 p-3 overflow-hidden">
      <div className="h-full grid grid-cols-2 gap-3">
        {/* Left Side - Create Form */}
        <Card className="h-full">
          <CardHeader className="py-2">
            <CardTitle className="text-center text-lg">CREATE PART NO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            {/* Year Format and Model Number in same row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Year Format Selector - More compact */}
              <div className="bg-gray-50 rounded-lg border p-2">
                <div className="text-xs font-medium mb-1">Year Format</div>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="yearFormat"
                      value="short"
                      checked={yearFormat === 'short'}
                      onChange={(e) => setYearFormat(e.target.value)}
                      className="w-3 h-3"
                    />
                    <span className="text-xs">Short (24)</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="radio"
                      name="yearFormat"
                      value="full"
                      checked={yearFormat === 'full'}
                      onChange={(e) => setYearFormat(e.target.value)}
                      className="w-3 h-3"
                    />
                    <span className="text-xs">Full (2024)</span>
                  </label>
                </div>
              </div>

              {/* Model Number Input - More compact */}
              <div className="bg-gray-50 rounded-lg border p-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium whitespace-nowrap">
                    Model Number <span className="text-red-500">*</span>
                  </span>
                  <Input
                    value={fields.find((f) => f.fieldName === 'Model Number')?.value || ''}
                    onChange={(e) => {
                      const index = fields.findIndex((f) => f.fieldName === 'Model Number');
                      updateFieldValue(index, e.target.value);
                    }}
                    className="h-7 text-sm"
                    placeholder="Enter Model Number"
                    maxLength={20}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Fields Grid - More compact */}
            <div className="border rounded-lg">
              <div className="grid grid-cols-[1fr,60px,60px] gap-2 text-xs font-medium bg-gray-50 p-2 border-b">
                <div>Description</div>
                <div className="text-center">Check</div>
                <div className="text-center">Order</div>
              </div>
              <div className="p-2 space-y-1">
                {fields
                  .filter((field) => field.fieldName !== 'Model Number')
                  .map((field) => (
                    <div
                      key={field.fieldName}
                      className="grid grid-cols-[1fr,60px,60px] gap-2 items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium min-w-[100px]">
                          {field.fieldName}
                          {field.isRequired && <span className="text-red-500 ml-0.5">*</span>}
                        </span>
                        <Input
                          value={field.value}
                          onChange={(e) => {
                            const index = fields.findIndex((f) => f.fieldName === field.fieldName);
                            updateFieldValue(index, e.target.value);
                          }}
                          className="h-7 text-sm"
                          placeholder={`Max ${field.maxLength}`}
                          readOnly={['Year', 'Month', 'Date'].includes(field.fieldName)}
                          maxLength={field.maxLength}
                        />
                      </div>
                      <div className="flex justify-center">
                        <Checkbox
                          checked={field.isChecked}
                          onCheckedChange={() => toggleField(field.fieldName)}
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Input
                          type="text"
                          value={field.order}
                          onChange={(e) => {
                            const index = fields.findIndex((f) => f.fieldName === field.fieldName);
                            updateOrder(index, e.target.value);
                          }}
                          className="w-12 h-7 text-sm text-center"
                          placeholder="#"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Generated Part Number - Highlighted and Bigger */}
            <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-700">Generated Part No:</span>
                <code className="bg-white px-4 py-2 rounded-md text-lg font-bold font-mono tracking-wider text-blue-800 shadow-sm">
                  {generatePartNumber(sortedFields)}
                </code>
              </div>
              <div className="text-xs text-blue-600">
                Order:{' '}
                {sortedFields
                  .filter((f) => f.isChecked && f.order !== '')
                  .map((f) => (
                    <span key={f.fieldName} className="inline-flex items-center">
                      <span className="font-medium">{f.fieldName}</span>
                      <span className="mx-1 text-blue-400">({f.order})</span>
                      {/* Add arrow except for last item */}
                      {f !==
                        sortedFields.filter((f) => f.isChecked && f.order !== '').slice(-1)[0] && (
                        <span className="mx-1 text-blue-400">→</span>
                      )}
                    </span>
                  ))}
              </div>
            </div>

            {/* Buttons - More compact */}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFields(DEFAULT_FIELDS.map((field) => ({ ...field })))}
              >
                Reset
              </Button>
              <Button size="sm" onClick={saveConfig}>
                Save Configuration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Side - Saved Configurations */}
        <Card className="h-full">
          <CardHeader className="py-2">
            <CardTitle className="text-lg">Saved Configurations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2">Created At</TableHead>
                  <TableHead className="py-2">Model Number</TableHead>
                  <TableHead className="py-2">Part Number</TableHead>
                  <TableHead className="w-[100px] py-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config._id}>
                    <TableCell>{new Date(config.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                        {getModelNumber(config.fields)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                        {generatePartNumber(config.fields)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(config)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(generatePartNumber(config.fields))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this configuration?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(config._id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

