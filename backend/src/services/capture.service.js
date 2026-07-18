import { prisma } from "../config/db.js";
import imagekit from "../config/imagekit.js";
import useragent from "useragent";
import { v4 as uuid } from "uuid";

export const captureImageService = async ({
  token,
  file,
  latitude,
  longitude,
  ipAddress,
  userAgent,
}) => {
  // Check image
  if (!file) {
    throw new Error("Image is required");
  }

  // Check capture link
  const link = await prisma.captureLink.findUnique({
    where: {
      token,
    },
  });

  if (!link) {
    throw new Error("Invalid capture link");
  }

  // Link active check
  if (!link.isActive) {
    throw new Error("This link is disabled");
  }

  // Expiry check
  if (link.expiresAt && new Date() > link.expiresAt) {
    throw new Error("This link has expired");
  }

  // Upload image to ImageKit
  const uploadedImage = await imagekit.upload({
  file: file.buffer,
  fileName: `${Date.now()}-${uuid()}.jpg`,
  folder: "/image-capture",
});

  // Detect browser/device
  const agent = useragent.parse(userAgent);

  const browser = agent.toAgent();
  const os = agent.os.toString();
  const device = agent.device.toString();

  // Save capture
  const capture = await prisma.capture.create({
    data: {
      linkId: link.id,

      imageUrl: uploadedImage.url,
      imageFileId: uploadedImage.fileId,

      ipAddress,

      browser,
      device,
      os,

      latitude,
      longitude,
    },
  });

  return {
    id: capture.id,

    imageUrl: capture.imageUrl,

    latitude: capture.latitude,
    longitude: capture.longitude,

    browser: capture.browser,
    device: capture.device,
    os: capture.os,

    ipAddress: capture.ipAddress,

    capturedAt: capture.capturedAt,
  };
};