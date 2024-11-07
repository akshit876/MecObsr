import { PartNumberConfig } from '@/db/models/partNumber.model';
import { NextResponse } from 'next/server';
import dbConnect from '@/db/config/dbConnect';

dbConnect();

export async function GET() {
  try {
    const configs = await PartNumberConfig.find().sort({ createdAt: -1 });
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    // Check for duplicate model number
    const modelNumber = body.fields.find(f => f.fieldName === 'Model Number')?.value;
    if (!modelNumber) {
      return NextResponse.json({ error: 'Model Number is required' }, { status: 400 });
    }

    // Check if model number already exists
    const existingConfig = await PartNumberConfig.findOne({
      'fields': {
        $elemMatch: {
          fieldName: 'Model Number',
          value: modelNumber
        }
      }
    });

    if (existingConfig) {
      return NextResponse.json(
        { error: 'A configuration with this Model Number already exists' },
        { status: 409 }
      );
    }

    const config = await PartNumberConfig.create(body);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req) {
  try {
    const { id, fields } = await req.json();

    // Check for duplicate model number
    const modelNumber = fields.find(f => f.fieldName === 'Model Number')?.value;
    if (!modelNumber) {
      return NextResponse.json({ error: 'Model Number is required' }, { status: 400 });
    }

    // Check if model number already exists (excluding current config)
    const existingConfig = await PartNumberConfig.findOne({
      _id: { $ne: id },
      'fields': {
        $elemMatch: {
          fieldName: 'Model Number',
          value: modelNumber
        }
      }
    });

    if (existingConfig) {
      return NextResponse.json(
        { error: 'A configuration with this Model Number already exists' },
        { status: 409 }
      );
    }

    const config = await PartNumberConfig.findByIdAndUpdate(
      id, 
      { fields }, 
      { new: true }
    );

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
