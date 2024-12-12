import { MongoClient, ObjectId } from 'mongodb';

const uri =  'mongodb://localhost:27017';
const dbName = 'main-data';

export async function GET(req, res) {
  try {
    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection('gradeConfig');
    
    const gradeConfig = await collection.findOne({});
    
    await client.close();
    return Response.json(gradeConfig);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch grade configuration' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { grade, updatedAt, updatedBy } = body;
    
    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection('gradeConfig');
    
    const existingConfig = await collection.findOne({});
    const documentId = existingConfig ? existingConfig._id : new ObjectId();
    
    await collection.updateOne(
      { _id: documentId },
      { $set: { grade, updatedAt, updatedBy } },
      { upsert: true }
    );
    
    await client.close();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Failed to update grade configuration' }, { status: 500 });
  }
} 