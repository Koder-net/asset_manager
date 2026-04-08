import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQRBatch extends Document {
  _id: mongoose.Types.ObjectId;
  batchNumber: string;
  assets: mongoose.Types.ObjectId[];
  copiesPerAsset: number;
  printedBy: mongoose.Types.ObjectId;
  printedByName: string;
  notes?: string;
  createdAt: Date;
}

const QRBatchSchema = new Schema<IQRBatch>(
  {
    batchNumber: { type: String, required: true, unique: true },
    assets: [{ type: Schema.Types.ObjectId, ref: 'Asset' }],
    copiesPerAsset: { type: Number, default: 1, min: 1, max: 20 },
    printedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    printedByName: { type: String, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const QRBatch: Model<IQRBatch> =
  mongoose.models.QRBatch || mongoose.model<IQRBatch>('QRBatch', QRBatchSchema);
export default QRBatch;
