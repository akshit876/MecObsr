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
import { Copy, Edit, Trash2, RefreshCcw } from 'lucide-react';
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
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([loadConfigs(), fetchShifts()]);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    initialize();

    // const interval = setInterval(() => {
    //   updateDateFields();
    // }, 60000);

    // return () => clearInterval(interval);
  }, []);

  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/shift-config');
      const data = await response.json();

      if (!data.shifts || !Array.isArray(data.shifts)) {
        console.error('Invalid shifts data format:', data);
        toast.error('Invalid shift data received');
        return;
      }

      if (data.shifts.length === 0) {
        console.warn('No shifts configured in the system');
        toast.warning('No shifts are configured');
        return;
      }

      console.log('Successfully loaded shifts:', data.shifts);
      setShifts(data.shifts);
      updateDateFields(); // Immediately update fields after getting shifts
    } catch (error) {
      console.error('Shift fetch error:', error);
      toast.error('Failed to load shift configurations');
    }
  };

  const getCurrentShift = (shiftsData) => {
    if (!shiftsData || shiftsData.length === 0) {
      console.warn('No shifts data available - please configure shifts');
      return '';
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    console.log('Current time in minutes:', currentTime, 'Available shifts:', shiftsData);

    for (const shift of shiftsData) {
      // Convert shift times to minutes for comparison
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);

      const startTimeInMinutes = startHour * 60 + startMin;
      const endTimeInMinutes = endHour * 60 + endMin;

      console.log('Checking shift:', {
        name: shift.name,
        start: startTimeInMinutes,
        end: endTimeInMinutes,
        currentTime,
      });

      // Handle shifts that cross midnight
      if (endTimeInMinutes < startTimeInMinutes) {
        if (currentTime >= startTimeInMinutes || currentTime <= endTimeInMinutes) {
          return shift.name;
        }
      } else {
        if (currentTime >= startTimeInMinutes && currentTime <= endTimeInMinutes) {
          return shift.name;
        }
      }
    }

    return ''; // Return empty if no shift matches
  };

  const getJulianDate = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return dayOfYear.toString().padStart(3, '0');
  };

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/part-number-config');
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      toast.error('Failed to load configurations');
    }
  };

  // Debug log to check fields state
  console.log('Current Fields:', fields);

  const toggleField = (fieldName) => {
    setFields((prevFields) => {
      const newFields = prevFields.map((field) => {
        if (field.fieldName === fieldName) {
          if (!field.isChecked && (!field.value || field.value.trim() === '')) {
            toast.error(`Cannot check ${fieldName} - value is required`);
            return field;
          }
          return { ...field, isChecked: !field.isChecked };
        }
        return field;
      });
      return newFields;
    });
  };

  const updateFieldValue = (index, value) => {
    const field = fields[index];

    // Skip if trying to edit read-only fields
    if (
      ['Year', 'Month', 'Date', 'Julian Date', 'Shift', 'Serial Number'].includes(field.fieldName)
    ) {
      return;
    }

    // Check max length
    if (field.maxLength && value.length > field.maxLength) {
      return;
    }

    setFields((prevFields) => {
      const newFields = [...prevFields];
      newFields[index] = { ...field, value };
      return newFields;
    });
  };

  // Add a refresh function that combines all refresh operations
  const refreshData = async () => {
    try {
      await Promise.all([loadConfigs(), fetchShifts()]);
      updateDateFields(); // Update fields after getting fresh data
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh data');
    }
  };

  // Modify the save function to include shift refresh
  const saveConfig = async () => {
    try {
      let j = 0;
      const modelNumber = fields.find((f) => f.fieldName === 'Model Number');
      if (!modelNumber?.value) {
        toast.error('Model Number is required');
        return;
      }

      const emptyCheckedFields = fields.filter(
        (field) => field.isChecked && (!field.value || field.value.trim() === ''),
      );

      if (emptyCheckedFields.length > 0) {
        toast.error(
          `The following checked fields cannot be empty: ${emptyCheckedFields.map((f) => f.fieldName).join(', ')}`,
        );
        return;
      }

      const checkedFields = fields.filter((field) => field.isChecked);
      const orders = checkedFields.map((field) => field.order);

      // Check for duplicate orders
      const uniqueOrders = new Set(orders);
      if (uniqueOrders.size !== orders.length) {
        toast.error('Order numbers must be unique for checked fields');
        return;
      }

      // Check for empty or invalid orders
      const hasInvalidOrder = checkedFields.some(
        (field) => field.order === '' || field.order === 0 || isNaN(field.order),
      );
      if (hasInvalidOrder) {
        toast.error('All checked fields must have a valid order number');
        return;
      }

      const fieldsToSave = fields.map((field) => {
        if (field.fieldName === 'Model Number') {
          return {
            ...field,
            order: 999,
            isChecked: false,
            isRequired: true,
          };
        }

        if (!field.isChecked) {
          j++;
          return {
            ...field,
            order: 999 + j,
          };
        }

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

      // Refresh all data after successful save
      await refreshData();
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
      .filter((field) => field.isChecked && field.order > 0)
      .sort((a, b) => a.order - b.order)
      .map((field) => field.value)
      .join('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Part number copied to clipboard');
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFields([]);
    setSelectedConfig(null);
    setIsEditing(false);
  };

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
    setFields((prevFields) => {
      const newFields = [...prevFields];
      newFields[index] = {
        ...newFields[index],
        order: newOrder === '' ? '' : parseInt(newOrder, 10) || 0,
      };
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
    const julianDate = getJulianDate();
    const currentShift = getCurrentShift(shifts);

    setFields((prevFields) =>
      prevFields.map((field) => {
        switch (field.fieldName) {
          case 'Year':
            return { ...field, value: year };
          case 'Month':
            return { ...field, value: month };
          case 'Date':
            return { ...field, value: date };
          case 'Julian Date':
            return { ...field, value: julianDate };
          case 'Shift':
            return { ...field, value: currentShift };
          case 'Serial Number':
            return { ...field, value: '0001' };
          default:
            return field;
        }
      }),
    );
  };

  // Call updateDateFields on initial load and when yearFormat changes
  useEffect(() => {
    updateDateFields();
  }, [yearFormat, shifts]);

  // Also call updateDateFields when component mounts
  useEffect(() => {
    updateDateFields();
  }, []);

  // Render fields separately from model number
  const renderFields = () => {
    const renderedFields = new Set();

    const displayFields = fields
      .filter((field) => {
        if (field.fieldName === 'Model Number' || renderedFields.has(field.fieldName)) {
          return false;
        }
        renderedFields.add(field.fieldName);
        return true;
      })
      .sort((a, b) => {
        if (a.order === '') return 1;
        if (b.order === '') return -1;
        return a.order - b.order;
      });

    return displayFields.map((field) => (
      <div
        key={field.fieldName}
        className="grid grid-cols-[1fr,80px,80px] gap-4 items-center py-2 border-b border-gray-200"
      >
        <div className="flex items-center gap-4">
          <span className="font-medium w-[150px]">
            {field.fieldName.toUpperCase()}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </span>
          <Input
            value={field.value}
            onChange={(e) => {
              const index = fields.findIndex((f) => f.fieldName === field.fieldName);
              updateFieldValue(index, e.target.value);
            }}
            className={`h-8 ${['Year', 'Month', 'Date', 'Julian Date', 'Shift', 'Serial Number'].includes(field.fieldName) ? 'bg-gray-100' : ''}`}
            readOnly={['Year', 'Month', 'Date', 'Julian Date', 'Shift', 'Serial Number'].includes(
              field.fieldName,
            )}
            maxLength={field.maxLength}
          />
        </div>
        <div className="flex justify-center items-center">
          <Checkbox
            checked={field.isChecked}
            onCheckedChange={() => toggleField(field.fieldName)}
            className="h-5 w-5 border-2 rounded-sm"
          />
        </div>
        <div className="flex justify-center items-center">
          <Input
            type="number"
            value={field.order}
            onChange={(e) => {
              const index = fields.findIndex((f) => f.fieldName === field.fieldName);
              updateOrder(index, e.target.value);
            }}
            className="w-16 h-8 text-center"
            placeholder="#"
            min="1"
          />
        </div>
      </div>
    ));
  };

  // Modify the handleReset function
  const handleReset = async () => {
    // First, reset all fields to their default state with empty orders
    setFields((prevFields) =>
      DEFAULT_FIELDS.map((defaultField) => {
        // For date-related and shift fields, keep them checked but with empty orders
        if (
          ['Year', 'Month', 'Date', 'Julian Date', 'Shift', 'Serial Number'].includes(
            defaultField.fieldName,
          )
        ) {
          return {
            ...defaultField,
            order: '', // Explicitly clear order
            isChecked: true,
            value: prevFields.find((f) => f.fieldName === defaultField.fieldName)?.value || '', // Keep current value
          };
        }
        // For all other fields, reset completely
        return {
          ...defaultField,
          value: '',
          order: '', // Explicitly clear order
          isChecked: false,
        };
      }),
    );

    // Fetch shifts but don't let it update orders
    try {
      const response = await fetch('/api/shift-config');
      const data = await response.json();

      if (data.shifts && Array.isArray(data.shifts)) {
        setShifts(data.shifts);
        // Don't call updateDateFields() here as it would reset orders
      }
    } catch (error) {
      console.error('Shift fetch error:', error);
      toast.error('Failed to refresh shifts');
    }

    toast.success('Form has been reset');
  };

  // Add a helper function to get Model Number
  const getModelNumber = (configFields) => {
    const modelNumberField = configFields.find((f) => f.fieldName === 'Model Number');
    return modelNumberField?.value || '';
  };

  // First, let's create a reinitialization function
  const reinitialize = async () => {
    try {
      await Promise.all([loadConfigs(), fetchShifts()]);
      updateDateFields(); // Update date fields after fetching fresh data
    } catch (error) {
      console.error('Reinitialization error:', error);
      toast.error('Failed to refresh data');
    }
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
                    // maxLength={20}
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
              <div className="p-2 space-y-1">{renderFields()}</div>
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
                onClick={handleReset}
                className="bg-gray-100 hover:bg-gray-200"
              >
                Reset
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={refreshData}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={saveConfig} className="bg-blue-600 hover:bg-blue-700">
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
