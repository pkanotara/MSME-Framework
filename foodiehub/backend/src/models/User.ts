import bcrypt from 'bcryptjs';
import { Schema, model, Document, Types } from 'mongoose';
import { UserRole } from '../types/roles';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  restaurantId?: Types.ObjectId;
  isActive: boolean;
  comparePassword: (candidate: string) => Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['super_admin', 'restaurant_owner', 'manager'], default: 'restaurant_owner' },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const UserModel = model<IUser>('User', userSchema);
