import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProblemReport extends Document {
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  title: string;
  description: string;
  images: string[];
  status: 'open' | 'answered' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const ProblemReportSchema = new Schema<IProblemReport>({
  farmerId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName:  { type: String, required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  images:      { type: [String], default: [] },
  status:      { type: String, enum: ['open','answered','closed'], default: 'open' },
}, { timestamps: true });

const ProblemReport: Model<IProblemReport> = mongoose.models.ProblemReport || mongoose.model<IProblemReport>('ProblemReport', ProblemReportSchema);
export default ProblemReport;
