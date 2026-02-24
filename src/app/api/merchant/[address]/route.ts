import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Context = { params: Promise<{ address: string }> }

export async function GET(
  req: NextRequest,
  context: Context
) {
  try {
    const { address } = await context.params;
    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { walletAddress: address }
    });

    if (!merchant) {
      // Return 200 for "not registered yet" to avoid noisy browser console
      // resource errors for an expected first-time merchant flow.
      return NextResponse.json({ exists: false, merchant: null });
    }

    return NextResponse.json({ exists: true, merchant });
  } catch (err: any) {
    console.error("GET merchant error:", err);
    return NextResponse.json({ error: "Failed to fetch merchant" }, { status: 500 });
  }
}
