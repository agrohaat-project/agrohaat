import mongoose, { Schema, Document, Model } from 'mongoose';

export type JobStatus =
  | 'available'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'confirmed';

export interface IStatusUpdate {
  message: string;
  createdAt: Date;
}

export interface ITransporterRating {
  stars: number;
  comment: string;
}

export interface IDeliveryJob extends Document {
  orderId: mongoose.Types.ObjectId;
  productTitle: string;
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  buyerId: mongoose.Types.ObjectId;
  buyerName: string;
  transporterId?: mongoose.Types.ObjectId;
  transporterName?: string;
  pickupLocation: { district: string; upazila: string; address: string };
  deliveryLocation: { district: string; upazila: string; address: string };
  productWeight: number;
  deliveryFee: number;
  status: JobStatus;
  notes: string;
  farmerReadyAt?: Date;
  pickedUpAt?: Date;
  inTransitAt?: Date;
  deliveredAt?: Date;
  confirmedAt?: Date;
  statusUpdates: IStatusUpdate[];
  farmerRating?: ITransporterRating;
  buyerRating?: ITransporterRating;
  createdAt: Date;
  updatedAt: Date;
}

const StatusUpdateSchema = new Schema<IStatusUpdate>(
  { message: { type: String, required: true }, createdAt: { type: Date, default: Date.now } },
  { _id: false }
);

const RatingSchema = new Schema<ITransporterRating>(
  { stars: { type: Number, required: true, min: 1, max: 5 }, comment: { type: String, default: '' } },
  { _id: false }
);

const DeliveryJobSchema = new Schema<IDeliveryJob>({
  orderId:      { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  productTitle: { type: String, required: true },
  farmerId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName:   { type: String, required: true },
  buyerId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName:    { type: String, required: true },
  transporterId:   { type: Schema.Types.ObjectId, ref: 'User' },
  transporterName: { type: String },
  pickupLocation: {
    district: { type: String, required: true },
    upazila:  { type: String, default: '' },
    address:  { type: String, default: '' },
  },
  deliveryLocation: {
    district: { type: String, required: true },
    upazila:  { type: String, default: '' },
    address:  { type: String, default: '' },
  },
  productWeight:  { type: Number, required: true },
  deliveryFee:    { type: Number, required: true },
  status: {
    type: String,
    enum: ['available', 'accepted', 'picked_up', 'in_transit', 'delivered', 'confirmed'],
    default: 'available',
  },
  notes:        { type: String, default: '' },
  farmerReadyAt: { type: Date },
  pickedUpAt:    { type: Date },
  inTransitAt:   { type: Date },
  deliveredAt:   { type: Date },
  confirmedAt:   { type: Date },
  statusUpdates: { type: [StatusUpdateSchema], default: [] },
  farmerRating:  { type: RatingSchema },
  buyerRating:   { type: RatingSchema },
}, { timestamps: true });

const DeliveryJob: Model<IDeliveryJob> =
  mongoose.models.DeliveryJob || mongoose.model<IDeliveryJob>('DeliveryJob', DeliveryJobSchema);
export default DeliveryJob;
