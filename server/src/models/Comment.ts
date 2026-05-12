import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export interface IComment {
  task: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CommentDoc = HydratedDocument<IComment>;
export type CommentModel = Model<IComment>;

const commentSchema = new Schema<IComment, CommentModel>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, minlength: 1, maxlength: 2000, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  },
);

commentSchema.index({ task: 1, createdAt: -1 });

export const Comment = mongoose.model<IComment, CommentModel>('Comment', commentSchema);
