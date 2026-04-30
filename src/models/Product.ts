import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  qualityGrade: string;
  harvestDate: Date;
  location: { district: string; upazila: string; address: string };
  images: string[];
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  farmerPhone: string;
  isAvailable: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category:    { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  quantity:    { type: Number, required: true, min: 0 },
  unit:        { type: String, required: true },
  qualityGrade:{ type: String, required: true },
  harvestDate: { type: Date, required: true },
  location: {
    district: { type: String, required: true },
    upazila:  { type: String, default: '' },
    address:  { type: String, default: '' },
  },
  images:      [{ type: String }],
  farmerId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName:  { type: String, required: true },
  farmerPhone: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  views:       { type: Number, default: 0 },
}, { timestamps: true });

ProductSchema.index({ title: 'text', description: 'text', category: 'text' });
ProductSchema.index({ 'location.district': 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
