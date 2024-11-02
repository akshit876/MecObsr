'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import React from 'react';
export default function PartNumberSelect() {
  const [configs, setConfigs] = useState([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Protect route
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'operator') {
      router.push('/dashboard');
      toast.error('Access denied. Operator access only.');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user) {
      loadConfigs();
    }
  }, [session]);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/part-number-config');

      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }

      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error('Load configs error:', error);
      toast.error('Failed to load part numbers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (config) => {
    try {
      if (!config?._id) {
        throw new Error('Invalid configuration');
      }

      // Store the selected config
      localStorage.setItem(
        'selectedPartConfig',
        JSON.stringify({
          ...config,
          selectedAt: new Date().toISOString(),
          selectedBy: session?.user?.email,
        }),
      );

      // Redirect to operator dashboard
      router.push('/operator-dashboard');
      toast.success('Part number selected successfully');
    } catch (error) {
      console.error('Selection error:', error);
      toast.error('Failed to select part number');
    }
  };

  const generatePartNumber = (fields) => {
    if (!Array.isArray(fields)) return '';

    return fields
      .filter((field) => field?.isChecked)
      .sort((a, b) => (a?.order || 0) - (b?.order || 0))
      .map((field) => field?.value || '')
      .filter(Boolean)
      .join('');
  };

  const getPartNumberDetails = (fields) => {
    if (!Array.isArray(fields)) return [];

    return fields
      .filter((field) => field?.isChecked)
      .sort((a, b) => (a?.order || 0) - (b?.order || 0))
      .map((field) => ({
        name: field?.fieldName || 'Unknown',
        value: field?.value || '',
        order: field?.order || 0,
      }));
  };

  const filteredConfigs = configs.filter((config) => {
    if (!config?.fields) return false;

    const partNumber = generatePartNumber(config.fields);
    return partNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Show loading state
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Show empty state
  if (!isLoading && filteredConfigs.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-gray-500 mb-4">No part numbers found</p>
            <Button onClick={loadConfigs}>Refresh</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Select Part Number</CardTitle>
            {/* <div className="flex items-center gap-2 w-[300px]">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search part numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div> */}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-base font-bold text-black">Part Number</TableHead>
                <TableHead className="text-base font-bold text-black">Created At</TableHead>
                {/* <TableHead className="text-base font-bold text-black">Components</TableHead> */}
                <TableHead className="text-base font-bold text-black w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConfigs.map((config) => {
                const partNumber = generatePartNumber(config.fields);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const details = getPartNumberDetails(config.fields);

                return (
                  <TableRow key={config._id} className="hover:bg-gray-50">
                    <TableCell>
                      <code className="relative rounded bg-green-100 px-[0.5rem] py-[0.5rem] font-mono text-2xl font-bold text-black">
                        {partNumber || 'Invalid Part Number'}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">
                      {config.createdAt
                        ? new Date(config.createdAt).toLocaleDateString()
                        : 'Unknown date'}
                    </TableCell>
                    {/* <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {details.map((detail, index) => (
                          <span key={detail.name}>
                            <span className="font-medium">{detail.name}</span>: {detail.value}
                            {index < details.length - 1 ? ' → ' : ''}
                          </span>
                        ))}
                      </div>
                    </TableCell> */}
                    <TableCell>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSelect(config)}
                        className="font-semibold"
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
