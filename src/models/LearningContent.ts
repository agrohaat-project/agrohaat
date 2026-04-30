import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILearningContent extends Document {
  title: string;
  description: string;
  type: 'video' | 'infographic' | 'guide' | 'tip';
  category: 'crop-care' | 'fertilizer' | 'pesticides' | 'cost-reduction' | 'extreme-weather' | 'tips-guides';
  youtubeId?: string;
  imageUrl?: string;
  content?: string;
  duration?: string;
  readTime?: string;
  tags: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  author: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: 'admin' | 'specialist' | 'farmer';
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  flags: Array<{ userId: string; reason: string; createdAt: Date }>;
  flagCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LearningContentSchema = new Schema<ILearningContent>(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type:        { type: String, enum: ['video', 'infographic', 'guide', 'tip'], required: true },
    category:    { type: String, enum: ['crop-care', 'fertilizer', 'pesticides', 'cost-reduction', 'extreme-weather', 'tips-guides'], required: true },
    youtubeId:   { type: String, default: '' },
    imageUrl:    { type: String, default: '' },
    content:     { type: String, default: '' },
    duration:    { type: String, default: '' },
    readTime:    { type: String, default: '' },
    tags:        [{ type: String }],
    difficulty:  { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    author:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName:  { type: String, required: true },
    authorRole:  { type: String, enum: ['admin', 'specialist', 'farmer'], required: true },
    status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
    flags: [
      {
        userId:    { type: String },
        reason:    { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    flagCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const LearningContent: Model<ILearningContent> =
  mongoose.models.LearningContent ||
  mongoose.model<ILearningContent>('LearningContent', LearningContentSchema);

export default LearningContent;
