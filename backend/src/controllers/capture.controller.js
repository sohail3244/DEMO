import { captureImageService } from "../services/capture.service.js";

export const captureImage = async (req, res) => {
  try {
    const { token } = req.params;
    const { latitude, longitude } = req.body;

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const userAgent = req.headers["user-agent"];

    const data = await captureImageService({
      token,
      file: req.file,
      latitude,
      longitude,
      ipAddress,
      userAgent,
    });

    return res.status(201).json({
      success: true,
      message: "Image captured successfully",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};