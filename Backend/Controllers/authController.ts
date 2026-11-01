import { Request, Response } from "express";
import { userModel } from "../Models/userModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isValidEmail, validateRequiredFields } from "../Utils/validation";

export const userSignup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userName, email, password } = req.body;

    const requiredFieldsValidation = validateRequiredFields({
      userName,
      email,
      password,
    });
    if (!requiredFieldsValidation.isValid) {
      res.status(400).json({
        error: `Missing required fields: ${requiredFieldsValidation.missingFields.join(
          ", "
        )}`,
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        error: "Invalid email format",
      });
      return;
    }

    if (userName.length < 2 || userName.length > 50) {
      res.status(400).json({
        error: "Username must be between 2 and 50 characters",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
      return;
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        error: "User with this email already exists",
      });
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await userModel.create({
      userName,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        email: newUser.email,
        id: newUser._id,
        userName: newUser.userName,
      },
      process.env.JWT_SECRET || "fallback_secret_change_in_production",
      { expiresIn: "24h" }
    );

    const userResponse = {
      id: newUser._id,
      userName: newUser.userName,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: "Internal server error during signup",
    });
  }
};

export const userLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const requiredFieldsValidation = validateRequiredFields({
      email,
      password,
    });
    if (!requiredFieldsValidation.isValid) {
      res.status(400).json({
        error: `Missing required fields: ${requiredFieldsValidation.missingFields.join(
          ", "
        )}`,
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        error: "Invalid email format",
      });
      return;
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      res.status(404).json({
        error: "User not found",
      });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      res.status(400).json({
        error: "Invalid credentials",
      });
      return;
    }

    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        userName: user.userName,
      },
      process.env.JWT_SECRET || "fallback_secret_change_in_production",
      { expiresIn: "24h" }
    );

    const userResponse = {
      id: user._id,
      userName: user.userName,
      email: user.email,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal server error during login",
    });
  }
};
