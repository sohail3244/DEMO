import { prisma } from "../config/db.js";

export const getDashboardStatsService = async () => {
  const totalLinks = await prisma.captureLink.count();

  const activeLinks = await prisma.captureLink.count({
    where: {
      isActive: true,
    },
  });

  const expiredLinks = await prisma.captureLink.count({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  const totalCaptures = await prisma.capture.count();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCaptures = await prisma.capture.count({
    where: {
      capturedAt: {
        gte: today,
      },
    },
  });

  return {
    totalLinks,
    activeLinks,
    expiredLinks,
    totalCaptures,
    todayCaptures,
  };
};

export const getRecentCapturesService = async () => {
  return await prisma.capture.findMany({
    take: 10,
    orderBy: {
      capturedAt: "desc",
    },
    include: {
      link: {
        select: {
          id: true,
          title: true,
          token: true,
        },
      },
    },
  });
};

export const getWeeklyChartService = async () => {
  const last7Days = [];

  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const count = await prisma.capture.count({
      where: {
        capturedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    last7Days.push({
      date: start.toLocaleDateString("en-IN", {
        weekday: "short",
      }),
      captures: count,
    });
  }

  return last7Days;
};