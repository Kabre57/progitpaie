import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/middleware-helpers";
import { deleteSession } from "@/lib/redis";

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (authUser?.userId) {
    await deleteSession(authUser.userId);
  }

  const cookieStore = await cookies();
  cookieStore.delete("rbeas_token");

  return NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );
}