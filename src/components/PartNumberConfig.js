'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { PlusCircle, Edit, Copy, Trash2 } from 'lucide-react';
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

export default function PartNumberConfig() {
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [fields, setFields] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/part-number-config');
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load configurations',
        variant: 'destructive',
      });
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
      toast({
        title: 'Validation Error',
        description: `Maximum length is ${field.maxLength} characters`,
        variant: 'destructive',
      });
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
      // Validate required fields
      const missingRequired = fields.filter(
        (field) => field.isRequired && field.isChecked && !field.value,
      );

      if (missingRequired.length > 0) {
        toast({
          title: 'Validation Error',
          description: `Please fill in required fields: ${missingRequired.map((f) => f.fieldName).join(', ')}`,
          variant: 'destructive',
        });
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
      setDialogOpen(false);
      setIsEditing(false);
      setSelectedConfig(null);
      setFields([]);

      toast({
        title: 'Success',
        description: 'Configuration saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (config) => {
    setSelectedConfig(config);
    setFields(config.fields);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedConfig(null);
    setFields(DEFAULT_FIELDS);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/part-number-config/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete configuration');

      await loadConfigs();
      toast({
        title: 'Success',
        description: 'Configuration deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
    toast({
      title: 'Copied',
      description: 'Part number copied to clipboard',
    });
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Part Number Configurations</CardTitle>
          <Button onClick={handleNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Configuration
          </Button>
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
                              Are you sure you want to delete this configuration? This action cannot
                              be undone.
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Configuration' : 'New Configuration'}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.fieldName}
                  className="flex items-center gap-4 p-4 bg-secondary rounded-lg"
                >
                  <div className="w-8 text-center">{field.order}</div>
                  <div className="w-40 font-medium">
                    {field.fieldName}
                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  <Input
                    value={field.value}
                    onChange={(e) => updateFieldValue(index, e.target.value)}
                    maxLength={field.maxLength}
                    placeholder={`Max ${field.maxLength} chars`}
                    className="max-w-[200px]"
                  />
                  <Checkbox checked={field.isChecked} onCheckedChange={() => toggleField(index)} />
                </div>
              ))}
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveConfig}>Save Configuration</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
