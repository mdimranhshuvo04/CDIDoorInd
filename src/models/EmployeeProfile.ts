import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmployeeProfile extends Document {
  user: mongoose.Types.ObjectId;
  employeeType: 'monthly' | 'task-based';
  baseSalary?: number;
  taskRate?: number;
  appointmentLetter?: string;
  joinedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeProfileSchema: Schema<IEmployeeProfile> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeType: { type: String, enum: ['monthly', 'task-based'], required: true },
    baseSalary: { type: Number, default: 0 },
    taskRate: { type: Number, default: 0 },
    appointmentLetter: { type: String },
    joinedDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const EmployeeProfile: Model<IEmployeeProfile> = mongoose.models.EmployeeProfile || mongoose.model<IEmployeeProfile>('EmployeeProfile', EmployeeProfileSchema);

export default EmployeeProfile;
