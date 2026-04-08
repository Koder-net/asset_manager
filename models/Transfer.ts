import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransfer extends Document {
  _id: mongoose.Types.ObjectId;
  asset: mongoose.Types.ObjectId;
  transferType: 'branch' | 'department' | 'location' | 'custodian';
  fromValue: string;
  toValue: string;
  transferDate: Date;
  reason?: string;
  authorizedBy?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TransferSchema = new Schema<ITransfer>(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    transferType: {
      type: String,
      enum: ['branch', 'department', 'location', 'custodian'],
      required: true,
    },
    fromValue: { type: String, required: true },
    toValue: { type: String, required: true },
    transferDate: { type: Date, required: true, default: Date.now },
    reason: { type: String, trim: true },
    authorizedBy: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Transfer: Model<ITransfer> =
  mongoose.models.Transfer || mongoose.model<ITransfer>('Transfer', TransferSchema);
export default Transfer;
