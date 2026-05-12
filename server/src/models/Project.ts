import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export const PROJECT_STATUSES = ['active', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface IProject {
  name: string;
  description: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectDoc = HydratedDocument<IProject>;
export type ProjectModel = Model<IProject>;

const projectSchema = new Schema<IProject, ProjectModel>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    description: { type: String, maxlength: 500, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    status: { type: String, enum: PROJECT_STATUSES, default: 'active', required: true, index: true },
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

projectSchema.index({ members: 1 });
projectSchema.index({ name: 'text', description: 'text' });

export const Project = mongoose.model<IProject, ProjectModel>('Project', projectSchema);
