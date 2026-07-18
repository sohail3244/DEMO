import { prisma } from "../config/db.js";
import { v4 as uuid } from "uuid";

export const createLinkService = async (adminId, title, expiresAt) => {
  const token = uuid();

  const link = await prisma.captureLink.create({
    data: {
      token,
      title,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      adminId,
    },
  });

  return {
    ...link,
    url: `http://localhost:3000/capture/${token}`,
  };
};

export const getAllLinksService = async (adminId) => {
  return prisma.captureLink.findMany({
    where: {
      adminId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          captures: true,
        },
      },
    },
  });
};

export const getLinkByTokenService = async (token) => {
  const link = await prisma.captureLink.findUnique({
    where: {
      token,
    },
  });

  if (!link) {
    throw new Error("Invalid Link");
  }

  if (!link.isActive) {
    throw new Error("Link is disabled");
  }

  if (link.expiresAt && new Date() > link.expiresAt) {
    throw new Error("Link expired");
  }

  return link;
};

export const updateLinkService = async (
  id,
  title,
  expiresAt,
  isActive
) => {
  return prisma.captureLink.update({
    where: {
      id,
    },
    data: {
      title,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive,
    },
  });
};

export const deleteLinkService = async (id) => {
  await prisma.captureLink.delete({
    where: {
      id,
    },
  });

  return true;
};