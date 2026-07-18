"use client";

import { useState } from "react";
import api from "../api";

export default function useLinks() {
  const [loading, setLoading] = useState(false);

  // Create Link
  const createLink = async (payload) => {
    try {
      setLoading(true);

      const { data } = await api.post("/link/create", payload);

      return data;
    } finally {
      setLoading(false);
    }
  };

  // Get All Links
  const getAllLinks = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/link");

      return data;
    } finally {
      setLoading(false);
    }
  };

  // Get Link By Token (Public)
  const getLinkByToken = async (token) => {
  try {
    setLoading(true);

    const { data } = await api.get(`/link/${token}`);

    console.log("API Response:", data);

    return data;
  } catch (err) {
    console.log("API Error:", err.response?.data);
    throw err;
  } finally {
    setLoading(false);
  }
};

  // Update Link
  const updateLink = async (id, payload) => {
    try {
      setLoading(true);

      const { data } = await api.put(`/link/${id}`, payload);

      return data;
    } finally {
      setLoading(false);
    }
  };

  // Delete Link
  const deleteLink = async (id) => {
    try {
      setLoading(true);

      const { data } = await api.delete(`/link/${id}`);

      return data;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createLink,
    getAllLinks,
    getLinkByToken,
    updateLink,
    deleteLink,
  };
}