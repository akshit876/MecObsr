import { PartNumberConfig } from '@/db/models/partNumber.model';
import { NextResponse } from 'next/server';
import dbConnect from '@/db/config/dbConnect';

dbConnect();

export async function GET() {
  try {
    // await connectDB();
    const configs = await PartNumberConfig.find().sort({ createdAt: -1 });
    return NextResponse.json(configs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    // await connectDB();
    const body = await req.json();
    const config = await PartNumberConfig.create(body);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req) {
  try {
    // await connectDB();
    const { id, fields } = await req.json();
    const config = await PartNumberConfig.findByIdAndUpdate(id, { fields }, { new: true });
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
