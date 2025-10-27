
import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    unique: true
  },
  subscription: {
    endpoint: String,
    expirationTime: mongoose.Schema.Types.Mixed,
    keys: {
      p256dh: String,
      auth: String
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PushSubscription = mongoose.models.PushSubscription || 
  mongoose.model('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;