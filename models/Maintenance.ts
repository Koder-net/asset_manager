import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMaintenance extends Document {
  _id: mongoose.Types.ObjectId;
  asset: mongoose.Types.ObjectId;
  maintenanceType: 'Repair' | 'Preventive' | 'Inspection' | 'Upgrade' | 'Disposal';
  description: string;
  startDate: Date;
  endDate?: Date;
  cost?: number;
  technician?: string;
  vendor?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenance>(
  {
    asset: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    maintenanceType: {
      type: String,
      enum: ['Repair', 'Preventive', 'Inspection', 'Upgrade', 'Disposal'],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    cost: { type: Number },
    technician: { type: String, trim: true },
    vendor: { type: String, trim: true },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const Maintenance: Model<IMaintenance> =
  mongoose.models.Maintenance || mongoose.model<IMaintenance>('Maintenance', MaintenanceSchema);
export default Maintenance;
