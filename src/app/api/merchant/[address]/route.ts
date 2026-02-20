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
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    return NextResponse.json(merchant);
  } catch (err: any) {
    console.error("GET merchant error:", err);
    return NextResponse.json({ error: "Failed to fetch merchant" }, { status: 500 });
  }
}
