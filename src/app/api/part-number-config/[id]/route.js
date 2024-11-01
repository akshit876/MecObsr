import { PartNumberConfig } from '@/db/models/partNumber.model';
import { NextResponse } from 'next/server';
import dbConnect from '@/db/config/dbConnect';

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    await PartNumberConfig.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const config = await PartNumberConfig.findById(params.id);
    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
