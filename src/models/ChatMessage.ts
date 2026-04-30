import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChatMessage extends Document {
  room: string;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  room:       { type: String, required: true, trim: true },
  senderId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  text:       { type: String, required: true, trim: true },
}, { timestamps: true });

const ChatMessage: Model<IChatMessage> = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export default ChatMessage;
