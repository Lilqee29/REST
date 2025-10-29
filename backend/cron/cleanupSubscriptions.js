import mongoose from 'mongoose';
import PushSubscription from '../models/pushSubscriptionModel.js';

const CLEANUP_DAYS = 60;

async function cleanupStaleSubscriptions() {
  await mongoose.connect(process.env.MONGO_URI);
  const threshold = new Date(Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000);
  const result = await PushSubscription.deleteMany({ lastActiveAt: { $lt: threshold } });
  console.log(`🗑️ Deleted ${result.deletedCount} stale subscriptions`);
  await mongoose.disconnect();
}

cleanupStaleSubscriptions();
