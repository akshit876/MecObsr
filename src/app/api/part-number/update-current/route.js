import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    // Get session without strict checking
    const session = await getServerSession();
    console.log('session', session);

    // More permissive session check
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
    }

    const { modelConfig, selectedBy, selectedAt } = await request.json();

    if (!modelConfig || !modelConfig.fields) {
      return NextResponse.json({ error: 'Model configuration is required' }, { status: 400 });
    }

    // Generate part number from the model fields
    const generatedPartNo = modelConfig.fields
      .filter(field => field.isChecked && field.value)
      .sort((a, b) => a.order - b.order)
      .map(field => field.value)
      .join('');

    // Connect to main-data database
    const mainDataDB = mongoose.connection.useDb('main-data');

    // Update the config with model configuration and generated part number
    const result = await mainDataDB.collection('config').findOneAndUpdate(
      {},
      {
        $set: {
          currentModelConfig: modelConfig,
          modelFields: modelConfig.fields,
          selectedBy,
          selectedAt,
          updatedAt: new Date().toISOString(),
          currentPartNumber: generatedPartNo,
          partNo: generatedPartNo,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );

    // Log the model change for audit purposes
    await mainDataDB.collection('model_change_logs').insertOne({
      modelConfig,
      generatedPartNo,
      selectedBy,
      selectedAt,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: result,
      generatedPartNo,
    });
  } catch (error) {
    console.error('Error updating current model configuration:', error);
    return NextResponse.json({ error: 'Failed to update current model configuration' }, { status: 500 });
  }
} 