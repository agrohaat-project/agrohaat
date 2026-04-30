import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'paid' | 'shipped' | 'delivered';
export type PaymentMethod = 'bkash' | 'nagad' | 'cash';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface IOrder extends Document {
  productId: mongoose.Types.ObjectId;
  productTitle: string;
  productImage: string;
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  buyerId: mongoose.Types.ObjectId;
  buyerName: string;
  buyerPhone: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  unit: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  deliveryAddress: { district: string; upazila: string; address: string };
  notes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  productId:    { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productTitle: { type: String, required: true },
  productImage: { type: String, default: '' },
  farmerId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName:   { type: String, required: true },
  buyerId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName:    { type: String, required: true },
  buyerPhone:   { type: String, default: '' },
  quantity:     { type: Number, required: true, min: 1 },
  unitPrice:    { type: Number, required: true },
  totalAmount:  { type: Number, required: true },
  unit:         { type: String, required: true },
  status:       { type: String, enum: ['pending','accepted','rejected','paid','shipped','delivered'], default: 'pending' },
  paymentMethod:        { type: String, enum: ['bkash','nagad','cash'] },
  paymentStatus:        { type: String, enum: ['unpaid','paid','refunded'], default: 'unpaid' },
  paymentTransactionId: { type: String },
  deliveryAddress: {
    district: { type: String, default: '' },
    upazila:  { type: String, default: '' },
    address:  { type: String, default: '' },
  },
  notes:           { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
}, { timestamps: true });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
