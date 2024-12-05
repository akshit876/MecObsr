'use client';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { Loader2, ZoomIn } from 'lucide-react';

export default function ImageSearch() {
  const [serialNumber, setSerialNumber] = useState('');
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleSearch = async () => {
    if (!serialNumber.trim()) {
      toast.error('Please enter a serial number');
      return;
    }

    if (serialNumber.length !== 26) {
      toast.error('Serial number must be 26 characters long');
      return;
    }

    const serialPattern = /^R\d{8}M\d{2}L\d{8}A\d{4}$/;
    if (!serialPattern.test(serialNumber)) {
      toast.error('Invalid serial number format');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/image-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serialNumber }),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.message);
        setImages([]);
        return;
      }

      setImages(data.images);
      if (data.images.length === 0) {
        toast.info('No images found for this serial number');
      }

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching for images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="h-screen w-full p-4 flex flex-col gap-4 bg-slate-50">
      <Card className="w-full">
        <CardHeader className="p-4 rounded-xl bg-[#012B41] text-white shadow-sm">
          <CardTitle className="text-xl font-semibold">
            Image Search
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex gap-4 mb-6">
            <Input
              type="text"
              placeholder="Enter serial number..."
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-[#012B41] hover:bg-[#023855]"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div 
                  key={index} 
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image.data}
                    alt={image.name}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                    {image.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl w-full max-h-[90vh] relative">
            <img
              src={selectedImage.data}
              alt={selectedImage.name}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
              {selectedImage.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 