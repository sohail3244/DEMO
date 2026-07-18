"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Clock,
  Ban,
  Camera,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import useLinks from "@/lib/hooks/useLinks";
import useCapture from "@/lib/hooks/useCapture";

export default function CapturePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token;

  const { getLinkByToken } = useLinks();
  const { createCapture } = useCapture();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const hasVerified = useRef(false);
  const verificationAttempted = useRef(false);

  const [pageState, setPageState] = useState("loading"); // loading | invalid | expired | inactive | permissions | camera-ready | uploading | success | error
  const [linkData, setLinkData] = useState(null);
  const [location, setLocation] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const startCamera = useCallback(async () => {
    try {
      // First check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API not supported");
        setCameraPermission(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraPermission(true);
    } catch (error) {
      console.error("Camera permission denied:", error);
      setCameraPermission(false);
    }
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      setLocationPermission(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationPermission(true);
      },
      (error) => {
        console.error("Location permission denied:", error);
        setLocationPermission(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      // Prevent multiple verification attempts
      if (!token || verificationAttempted.current) return;

      verificationAttempted.current = true;
      setPageState("loading");

      try {
        console.log("Verifying token:", token);
        const data = await getLinkByToken(token);
        console.log("Link data received:", data);

        // Check if we got valid data
        if (!data) {
          console.error("No data received from API");
          setPageState("invalid");
          setErrorMessage("No response from server");
          return;
        }

        // Check for API error response
        if (data.error) {
          console.error("API returned error:", data.error);
          setPageState("invalid");
          setErrorMessage(data.message || "Link verification failed");
          return;
        }

        // Handle 404 or not found
        if (data.status === 404 || data.message === "Not found") {
          console.error("Link not found");
          setPageState("invalid");
          return;
        }

        setLinkData(data);

        // Extract status from different possible response structures
        const linkStatus = data.status || data.link?.status || data.data?.status;

        console.log("Link status:", linkStatus);

        if (linkStatus === "expired") {
          setPageState("expired");
          return;
        }

        if (linkStatus === "inactive") {
          setPageState("inactive");
          return;
        }

        if (linkStatus === "active") {
          setPageState("permissions");
          return;
        }

        // If status is undefined but data exists, treat as valid
        if (data.token || data.link?.token || data.data?.token) {
          console.log("Token found, treating as active");
          setPageState("permissions");
          return;
        }

        // If we get here, something unexpected happened
        console.error("Unexpected response structure:", data);
        setPageState("invalid");
        setErrorMessage("Invalid response from server");
      } catch (error) {
        console.error("Token verification failed:", error);
        
        // Handle Axios error specifically
        if (error.response) {
          // Server responded with error status
          console.error("Server error response:", error.response.status);
          if (error.response.status === 404) {
            setPageState("invalid");
          } else if (error.response.status === 410) {
            setPageState("expired");
          } else {
            setPageState("invalid");
            setErrorMessage(`Server error: ${error.response.status}`);
          }
        } else if (error.request) {
          // Request made but no response (network error)
          console.error("Network error - no response received");
          setErrorMessage("Network error. Please check your connection.");
          
          // Retry logic - retry up to 3 times
          if (retryCount < 3) {
            console.log(`Retrying... Attempt ${retryCount + 1} of 3`);
            setRetryCount(prev => prev + 1);
            verificationAttempted.current = false; // Reset to allow retry
            setTimeout(() => {
              setPageState("loading");
            }, 2000);
            return;
          }
          
          setPageState("invalid");
        } else {
          // Something else went wrong
          setPageState("invalid");
          setErrorMessage(error.message || "An unexpected error occurred");
        }
      }
    };

    verifyToken();
  }, [token, getLinkByToken, retryCount]);

  useEffect(() => {
    if (pageState === "permissions") {
      startCamera();
      getLocation();
    }
  }, [pageState, startCamera, getLocation]);

  useEffect(() => {
    if (cameraPermission && locationPermission && pageState === "permissions") {
      setPageState("camera-ready");
    }
  }, [cameraPermission, locationPermission, pageState]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas;
  }, []);

  const handleCapture = async () => {
    if (!token || !location) {
      toast.error("Missing required data");
      return;
    }

    setPageState("uploading");

    try {
      const canvas = capturePhoto();

      if (!canvas) {
        throw new Error("Failed to capture photo");
      }

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          "image/jpeg",
          0.9
        );
      });

      const formData = new FormData();
      formData.append("image", blob, `capture-${Date.now()}.jpg`);
      formData.append("latitude", location.latitude.toString());
      formData.append("longitude", location.longitude.toString());
      formData.append("token", token);

      await createCapture(formData);

      stopCamera();
      setPageState("success");
      toast.success("Image submitted successfully");
    } catch (error) {
      console.error("Upload failed:", error);
      
      // Handle upload errors
      if (error.response) {
        setErrorMessage(`Upload failed: ${error.response.status} - ${error.response.data?.message || 'Server error'}`);
      } else if (error.request) {
        setErrorMessage("Network error during upload. Please check your connection and try again.");
      } else {
        setErrorMessage(error.message || "Failed to upload image");
      }
      
      setPageState("error");
      toast.error("Failed to submit image");
    }
  };

  const handleRetry = () => {
    setPageState("camera-ready");
    setErrorMessage("");
    startCamera();
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleAllowCameraAgain = () => {
    startCamera();
  };

  const handleRetryLocation = () => {
    getLocation();
  };

  const handleRetryVerification = () => {
    verificationAttempted.current = false;
    setRetryCount(0);
    setErrorMessage("");
    setPageState("loading");
  };

  // Loading State
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-black mb-2">
            Verifying Link...
          </h2>
          <p className="text-black">
            {retryCount > 0 
              ? `Retrying... Attempt ${retryCount} of 3` 
              : "Please wait while we verify your link"}
          </p>
          {errorMessage && (
            <p className="text-sm text-red-600 mt-4 bg-red-50 rounded-lg p-3">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Invalid Link State
  if (pageState === "invalid") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Invalid Link</h2>
          <p className="text-black mb-2">
            This capture link does not exist or has been removed.
          </p>
          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-6">
              {errorMessage}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetryVerification}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expired Link State
  if (pageState === "expired") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Link Expired</h2>
          <p className="text-black mb-6">
            This capture link has expired and is no longer accepting
            submissions.
          </p>
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Inactive Link State
  if (pageState === "inactive") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Link Disabled</h2>
          <p className="text-black mb-6">
            This capture link is no longer active and cannot accept submissions.
          </p>
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Permissions State - Camera Denied
  if (pageState === "permissions" && !cameraPermission && locationPermission) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">
            Camera Permission Required
          </h2>
          <p className="text-black mb-6">
            We need access to your camera to capture your photo. Please allow
            camera access to continue.
          </p>
          <button
            onClick={handleAllowCameraAgain}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Camera className="w-4 h-4 mr-2" />
            Allow Camera Again
          </button>
        </div>
      </div>
    );
  }

  // Permissions State - Location Denied
  if (pageState === "permissions" && !locationPermission && cameraPermission) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">
            Location Permission Required
          </h2>
          <p className="text-black mb-6">
            We need your location to verify your identity. Please allow location
            access to continue.
          </p>
          <button
            onClick={handleRetryLocation}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Retry Location
          </button>
        </div>
      </div>
    );
  }

  // Permissions State - Both Denied
  if (pageState === "permissions" && !cameraPermission && !locationPermission) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">
            Permissions Required
          </h2>
          <p className="text-black mb-6">
            We need access to your camera and location to continue with the
            verification process.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAllowCameraAgain}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Camera className="w-4 h-4 mr-2" />
              Allow Camera
            </button>
            <button
              onClick={handleRetryLocation}
              className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Allow Location
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Camera Ready State
  if (pageState === "camera-ready") {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <Toaster position="top-center" />

        <div className="max-w-2xl mx-auto">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-black mb-2">
                Identity Verification
              </h1>
              <p className="text-black">
                Please position your face clearly in the camera frame and click
                capture.
              </p>
            </div>

            {/* Camera Preview */}
            <div className="relative bg-black rounded-xl overflow-hidden mb-6 aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Location and Camera Status Indicators */}
              <div className="absolute top-3 right-3 flex gap-2">
                {cameraPermission && (
                  <div className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    Camera
                  </div>
                )}
                {locationPermission && (
                  <div className="bg-green-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </div>
                )}
              </div>
            </div>

            {/* Capture Button */}
            <button
              onClick={handleCapture}
              disabled={pageState === "uploading"}
              className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>
          </div>

          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    );
  }

  // Uploading State
  if (pageState === "uploading") {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-black mb-2">
                Identity Verification
              </h1>
              <p className="text-black">
                Uploading your verification data...
              </p>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden mb-6 aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white bg-opacity-90 rounded-xl p-6 text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-black font-semibold">Uploading...</p>
                  <p className="text-sm text-black mt-1">Please don't close this page</p>
                </div>
              </div>
            </div>

            <button
              disabled
              className="w-full py-4 bg-gray-400 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    );
  }

  // Success State
  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">
            Verification Completed
          </h2>
          <p className="text-black mb-6">
            Your image has been submitted successfully. Thank you for
            completing the verification process.
          </p>
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Error State
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Upload Failed</h2>
          <p className="text-black mb-2">
            There was an error submitting your image.
          </p>
          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-6">
              {errorMessage}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-600" />
        </div>
        <h2 className="text-xl font-semibold text-black mb-2">
          Something went wrong
        </h2>
        <p className="text-black mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={handleGoBack}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </button>
      </div>
    </div>
  );
}