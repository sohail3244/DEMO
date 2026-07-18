import {
  getDashboardStatsService,
  getRecentCapturesService,
  getWeeklyChartService,
} from "../services/dashboard.service.js";

export const getDashboardStats = async (req, res) => {
  try {
    const data = await getDashboardStatsService();

    return res.json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRecentCaptures = async (req, res) => {
  try {
    const data = await getRecentCapturesService();

    return res.json({
      success: true,
      message: "Recent captures fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getWeeklyChart = async (req, res) => {
  try {
    const data = await getWeeklyChartService();

    return res.json({
      success: true,
      message: "Chart data fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};