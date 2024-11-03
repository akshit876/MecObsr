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

  const toggleField = (index) => {
    const updatedFields = fields.map((field, i) => ({
      ...field,
      isChecked: i === index ? !field.isChecked : field.isChecked,
    }));
    setFields(updatedFields);
  };

  const updateFieldValue = (index, value) => {
    const field = fields[index];
    if (field.maxLength && value.length > field.maxLength) {
      toast.error(`Maximum length is ${field.maxLength} characters`);
      return;
    }

    const updatedFields = fields.map((field, i) => ({
      ...field,
      value: i === index ? value : field.value,
    }));
    setFields(updatedFields);
  };

  const saveConfig = async () => {
    try {
      const missingRequired = fields.filter(
        (field) => field.isRequired && field.isChecked && !field.value,
      );

      if (missingRequired.length > 0) {
        toast.error(
          `Please fill in required fields: ${missingRequired.map((f) => f.fieldName).join(', ')}`,
        );
        return;
      }

      const response = await fetch('/api/part-number-config', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedConfig?._id,
          fields: fields,
        }),
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      await loadConfigs();
      setIsEditing(false);
      setSelectedConfig(null);
      setFields(DEFAULT_FIELDS.map((field) => ({ ...field })));

      toast.success('Configuration saved successfully');
    } catch (error) {
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
      .filter((field) => field.isChecked)
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

    // Allow empty input for temporary state
    if (newOrder === '' || isNaN(numericOrder)) {
      const updatedFields = fields.map((field, i) =>
        i === index ? { ...field, order: '' } : field,
      );
      setFields(updatedFields);
      return;
    }

    // Basic validation
    if (isNaN(numericOrder) || numericOrder < 1) {
      toast.error('Please enter a positive number');
      return;
    }

    // Update the order
    const updatedFields = fields.map((field, i) =>
      i === index ? { ...field, order: numericOrder } : field,
    );
    setFields(updatedFields);
  };

  // Sort fields by order for display
  const sortedFields = [...fields].sort((a, b) => {
    // Handle empty or invalid orders
    if (a.order === '') return 1;
    if (b.order === '') return -1;
    return a.order - b.order;
  });

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-xl border-b pb-2">CREATE PART NO</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-[1fr,80px,80px] gap-4 mb-4">
            <div className="text-sm font-medium">Description</div>
            <div className="text-sm font-medium text-center">Check Box</div>
            <div className="text-sm font-medium text-center">Order</div>
          </div>

          {fields.map((field, index) => (
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
                  onChange={(e) => updateFieldValue(index, e.target.value)}
                  // maxLength={field.maxLength}
                  className="h-8"
                  placeholder={`Max ${field.maxLength} chars`}
                />
              </div>
              <div className="flex justify-center items-center">
                <Checkbox
                  checked={field.isChecked}
                  onCheckedChange={() => toggleField(index)}
                  className="h-5 w-5 border-2 rounded-sm"
                />
              </div>
              <div className="flex justify-center items-center">
                <Input
                  type="text" // Changed to text to allow empty state
                  value={field.order}
                  onChange={(e) => updateOrder(index, e.target.value)}
                  className="w-16 h-8 text-center"
                  placeholder="#"
                />
              </div>
            </div>
          ))}

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-4">
              <span className="font-medium w-[150px]">Generated Part No:</span>
              <div className="flex-1">
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                  {generatePartNumber(sortedFields)} {/* Use sortedFields here */}
                </code>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-muted-foreground">
              Current Order:{' '}
              {sortedFields
                .filter((f) => f.isChecked && f.order !== '')
                .map((f) => `${f.fieldName}(${f.order})`)
                .join(' → ')}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setFields(DEFAULT_FIELDS.map((field) => ({ ...field })))}
            >
              Reset
            </Button>
            <Button onClick={saveConfig}>Save Configuration</Button>
          </div>
        </CardContent>
      </Card>

      {configs.length > 0 && (
        <Card className="max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Saved Configurations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created At</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config._id}>
                    <TableCell>{new Date(config.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                        {generatePartNumber(config.fields)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
      )}
    </main>
  );
}
