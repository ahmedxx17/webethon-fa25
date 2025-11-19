import { Schema, model, models } from "mongoose";

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["Ideation", "Active Sprint", "Review", "Launched"],
      default: "Ideation",
    },
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    manager: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Project = models.Project || model("Project", ProjectSchema);

export default Project;

