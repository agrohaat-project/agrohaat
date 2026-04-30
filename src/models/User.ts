import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'farmer' | 'buyer' | 'transporter' | 'admin' | 'specialist';
  isVerified: boolean;
  isApproved: boolean;
  isSuspended: boolean;
  location: { district: string; upazila: string; address: string };
  profileImage: string;
  bio: string;
  interests: string[];
  viewedContent: Array<{ contentId: string; tags: string[]; viewedAt: Date }>;
  clickedCategories: Array<{ category: string; clickedAt: Date }>;
  searchHistory: Array<{ query: string; searchedAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true },
  phone:       { type: String, required: true, trim: true },
  role:        { type: String, enum: ['farmer','buyer','transporter','admin','specialist'], required: true },
  isVerified:  { type: Boolean, default: false },
  isApproved:  { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  location: {
    district: { type: String, default: '' },
    upazila:  { type: String, default: '' },
    address:  { type: String, default: '' },
  },
  profileImage: { type: String, default: '' },
  bio:          { type: String, default: '' },
  interests:    [{ type: String }],
  viewedContent: [{
    contentId: { type: String },
    tags:      [{ type: String }],
    viewedAt:  { type: Date, default: Date.now },
  }],
  clickedCategories: [{
    category:  { type: String },
    clickedAt: { type: Date, default: Date.now },
  }],
  searchHistory: [{
    query:      { type: String },
    searchedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
