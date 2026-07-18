"use client";

import { useState } from "react";
import api from "../api";

export default function useCapture() {
  const [loading, setLoading] = useState(false);

  // Upload Capture
  const createCapture = async (formData) => {
    try {
      setLoading(true);

      const { data } = await api.post("/capture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return data;
    } finally {
      setLoading(false);
    }
  };

  // Get All Captures
  const getAllCaptures = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/capture");

      return data;
    } finally {
      setLoading(false);
    }
  };

  // Get Single Capture
  const getCaptureById = async (id) => {
    try {
      setLoading(true);

      const { data } = await api.get(`/capture/${id}`);

      return data;
    } finally {
      setLoading(false);
    }
  };

  // Delete Capture
  const deleteCapture = async (id) => {
    try {
      setLoading(true);

      const { data } = await api.delete(`/capture/${id}`);

      return data;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createCapture,
    getAllCaptures,
    getCaptureById,
    deleteCapture,
  };
}