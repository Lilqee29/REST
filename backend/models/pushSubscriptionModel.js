import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      // ❌ REMOVED: index: true  (this creates userId_1 index which prevents multiple devices)
    },
    subscription: {
      endpoint: { type: String, required: true },
      expirationTime: { type: mongoose.Schema.Types.Mixed, default: null },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
      },
    },
    lastActiveAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ✅ ONLY THIS INDEX: Allows multiple devices per user, but prevents duplicate endpoints
pushSubscriptionSchema.index({ userId: 1, 'subscription.endpoint': 1 }, { unique: true });

// Update updatedAt on save
pushSubscriptionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;