import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
await mongoose.connection.collection('inventories').dropIndex('pharmacy_1_medicine_1');
console.log('Index dropped successfully');
await mongoose.disconnect();