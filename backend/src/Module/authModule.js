import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema = mongoose.Schema(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: false, default: null },
    pimage: { type: String, default: "" },
    googleId: { type: String, default: null },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

const authModule = mongoose.models.User || mongoose.model("User", userSchema);
export default authModule;
