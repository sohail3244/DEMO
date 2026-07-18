import { loginService } from "../services/auth.service.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const data = await loginService(email, password);

    res.status(200).json({
      success: true,
      message: "Login Successful",
      data,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};