import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  fromUserId: mongoose.Types.ObjectId;
  fromUserName: string;
  toUserId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  rating: number;
  timeliness?: number;
  pricing?: number;
  communication?: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  fromUserId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fromUserName:   { type: String, required: true },
  toUserId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderId:        { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  rating:         { type: Number, required: true, min: 1, max: 5 },
  timeliness:     { type: Number, min: 1, max: 5, default: 5 },
  pricing:        { type: Number, min: 1, max: 5, default: 5 },
  communication:  { type: Number, min: 1, max: 5, default: 5 },
  comment:        { type: String, default: '' },
}, { timestamps: true });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
