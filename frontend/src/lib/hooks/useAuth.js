"use client";

import { useState } from "react";
import api from "../api";

export default function useAuth() {
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    try {
      setLoading(true);

      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", data.data.token);

      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  return {
    loading,
    login,
    logout,
    getToken,
    isAuthenticated,
  };
}