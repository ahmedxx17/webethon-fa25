import { Schema, model, models } from "mongoose";

const TaskSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["To-Do", "In-Progress", "Review", "Done"],
      default: "To-Do",
    },
    xp: { type: Number, default: 50 },
    badges: { type: [String], default: [] },
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approved: { type: Boolean, default: false },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  },
  { timestamps: true }
);

const Task = models.Task || model("Task", TaskSchema);

export default Task;

