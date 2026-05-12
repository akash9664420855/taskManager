import mongoose, { Schema, type HydratedDocument, type Model, type Types } from 'mongoose';

export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface ITask {
  title: string;
  description: string;
  project: Types.ObjectId;
  assignee: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskDoc = HydratedDocument<ITask>;
export type TaskModel = Model<ITask>;

const taskSchema = new Schema<ITask, TaskModel>(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, maxlength: 2000, default: '' },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: TASK_STATUSES, default: 'todo', required: true, index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium', required: true, index: true },
    dueDate: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
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

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1, dueDate: 1 });
taskSchema.index({ title: 'text', description: 'text' });

export const Task = mongoose.model<ITask, TaskModel>('Task', taskSchema);
