import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware-helpers";
import { NotificationType, Prisma } from "@prisma/client";
import { incrUnreadNotifications } from "@/lib/redis";
import { ApiResponse } from "@/types";

// POST /api/notifications - Create a notification (internal use)
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const body = await request.json();
    const { userId, title, message, type, link } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "UserId, title, and message are required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: (type || "info") as NotificationType,
        link: link || null,
        isRead: false,
      },
    });

    await incrUnreadNotifications(userId);

    const responseData = {
      ...notification,
      _id: notification.id,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create notification",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// GET /api/notifications - Get user's notifications
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireAuth(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Prisma.NotificationWhereInput = { userId: user.userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: user.userId, isRead: false },
      }),
    ]);

    const formattedNotifications = notifications.map((n) => ({
      ...n,
      _id: n.id,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedNotifications,
        unreadCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch notifications",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
