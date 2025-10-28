import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user', // Make sure your user model name matches this
      required: true,
      index: true,
    },
    subscription: {
      endpoint: {
        type: String,
        required: true,
      },
      expirationTime: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
      },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ✅ Prevent same device being stored multiple times
pushSubscriptionSchema.index({ userId: 1, 'subscription.endpoint': 1 }, { unique: true });

// ✅ Automatically update timestamp when document is modified
pushSubscriptionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;
