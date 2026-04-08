import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  entityCode?: string;
  changes?: Record<string, unknown>;
  performedBy: mongoose.Types.ObjectId;
  performedByName: string;
  performedByRole: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    entityCode: { type: String },
    changes: { type: Schema.Types.Mixed },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    performedByName: { type: String, required: true },
    performedByRole: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ performedBy: 1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
