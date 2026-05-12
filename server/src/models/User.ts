import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = ['admin', 'manager', 'member'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatarUrl?: string | null;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDoc = HydratedDocument<IUser, IUserMethods>;
export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'member', required: true, index: true },
    avatarUrl: { type: String, default: null },
    tokenVersion: { type: Number, default: 0, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).password;
        delete (ret as Record<string, unknown>).__v;
        delete (ret as Record<string, unknown>).tokenVersion;
        return ret;
      },
    },
  },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
