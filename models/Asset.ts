import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAsset extends Document {
  _id: mongoose.Types.ObjectId;
  assetCode: string;
  qrCodeData: string;
  item_name: string;
  category: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  source?: string;
  supplier_name?: string;
  invoice_number?: string;
  purchased_date?: Date;
  received_date?: Date;
  delivered_by?: string;
  brought_by?: string;
  branch: string;
  department: string;
  location: string;
  custodian?: string;
  condition_status: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
  asset_status: 'Active' | 'In Storage' | 'In Repair' | 'Transferred' | 'Missing' | 'Disposed';
  warranty_end_date?: Date;
  cost_value?: number;
  notes?: string;
  image?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    assetCode: { type: String, required: true, unique: true, index: true },
    qrCodeData: { type: String, required: true },
    item_name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    serial_number: { type: String, trim: true },
    source: { type: String, trim: true },
    supplier_name: { type: String, trim: true },
    invoice_number: { type: String, trim: true },
    purchased_date: { type: Date },
    received_date: { type: Date },
    delivered_by: { type: String, trim: true },
    brought_by: { type: String, trim: true },
    branch: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    custodian: { type: String, trim: true },
    condition_status: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
      default: 'Good',
    },
    asset_status: {
      type: String,
      enum: ['Active', 'In Storage', 'In Repair', 'Transferred', 'Missing', 'Disposed'],
      default: 'Active',
    },
    warranty_end_date: { type: Date },
    cost_value: { type: Number },
    notes: { type: String, trim: true },
    image: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AssetSchema.index({ item_name: 'text', serial_number: 'text', assetCode: 'text' });
AssetSchema.index({ category: 1, branch: 1, department: 1, asset_status: 1 });

const Asset: Model<IAsset> = mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
export default Asset;
