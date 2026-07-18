"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function useDashboard() {
  const [stats, setStats] = useState(null);
  const [recentCaptures, setRecentCaptures] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard Stats
  const getDashboardStats = async () => {
    try {
      const { data } = await api.get("/dashboard/stats");

      setStats(data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch dashboard stats");
    }
  };

  // Recent Captures
  const getRecentCaptures = async () => {
    try {
      const { data } = await api.get("/dashboard/recent-captures");

      setRecentCaptures(data.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch recent captures"
      );
    }
  };

  // Weekly Chart
  const getChartData = async () => {
    try {
      const { data } = await api.get("/dashboard/chart");

      setChartData(data.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch chart data"
      );
    }
  };

  // Fetch All Dashboard Data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        getDashboardStats(),
        getRecentCaptures(),
        getChartData(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return {
    loading,
    error,

    stats,
    recentCaptures,
    chartData,

    fetchDashboard,
    getDashboardStats,
    getRecentCaptures,
    getChartData,
  };
}