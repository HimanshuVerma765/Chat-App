import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Signup new user
export const signup = async (req, res) => {
  const { email, fullName, password, bio } = req.body;

  try {
    if (!email || !fullName || !password || !bio) {
      return res.json({ success: false, error: "Missing Details" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.json({ success: false, error: "Account already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      fullName,
      password: hashedPassword,
      bio,
    });

    // persist the user to the database
    const savedUser = await newUser.save();

    // prepare response without password
    const userData = savedUser.toObject();
    delete userData.password;

    const token = generateToken(savedUser._id);
    res.json({
      success: true,
      userData,
      token,
      message: "Account created successfully",
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

// Controller to login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.json({ success: false, error: "Invalid Credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res.json({ success: false, error: "Invalid Credentials" });
    }

    const token = generateToken(userData._id);
    const user = userData.toObject();
    delete user.password;

    res.json({
      success: true,
      userData: user,
      token,
      message: "Login Successful",
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: err.message });
  }
};

//  Controller to check if user is authenticated
export const checkAuth = (req, res) => {
  // return user under `userData` to match login/signup responses
  res.json({ success: true, userData: req.user });
};

// Controller to update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;
    const userId = req.user._id;
    let updatedUser;
    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { fullName, bio },
        { new: true }
      );
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          profilePic: upload.secure_url,
          bio,
          fullName,
        },
        { new: true }
      );
    }
    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.log(err.message);

    res.json({
      success: false,
      user: err.message,
    });
  }
};
