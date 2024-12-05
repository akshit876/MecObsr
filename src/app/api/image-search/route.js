import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req) {
  try {
    const { serialNumber } = await req.json();
    
    // Use the external directory path
    const imageDir = 'D:\\cameraimage';
    
    // Read the directory
    const files = await fs.readdir(imageDir);
    
    // Search for matching files (case insensitive)
    const matchingFiles = files.filter(file => 
      file.toLowerCase().includes(serialNumber.toLowerCase())
    );
    
    if (matchingFiles.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No matching images found' 
      });
    }
    
    // Return the full file paths and base64 encoded images
    const images = await Promise.all(matchingFiles.map(async (file) => {
      const filePath = path.join(imageDir, file);
      const imageBuffer = await fs.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      return {
        name: file,
        data: `data:image/jpeg;base64,${base64Image}`
      };
    }));
    
    return NextResponse.json({ 
      success: true, 
      images 
    });
    
  } catch (error) {
    console.error('Image search error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error searching for images' 
    }, { status: 500 });
  }
} 