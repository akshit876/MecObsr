import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { PartNumberConfig } from '@/db/models/partNumber.model';

// Basic connection function
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

    if (mongoose.connection.readyState === 1) {
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Failed to connect to database');
  }
};

// Debug function to verify connection
const debugConnection = () => {
  console.log('Connection State:', mongoose.connection.readyState);
  console.log('Current Database:', mongoose.connection.name);
  console.log('Full Connection String:', mongoose.connection.host + '/' + mongoose.connection.name);
};

export async function GET() {
  try {
    await connectDB();
    const configs = await PartNumberConfig.find().sort({ createdAt: -1 });
    return NextResponse.json(configs);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const config = await PartNumberConfig.create(body);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const { id, fields } = await req.json();
    const config = await PartNumberConfig.findByIdAndUpdate(id, { fields }, { new: true });
    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Configuration ID is required' }, { status: 400 });
    }

    const config = await PartNumberConfig.findByIdAndDelete(id);
    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
