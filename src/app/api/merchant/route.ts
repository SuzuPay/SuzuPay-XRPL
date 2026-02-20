import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, businessName, email } = body;

    if (!walletAddress || !businessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const merchant = await prisma.merchant.upsert({
      where: { walletAddress },
      update: { businessName, email },
      create: { walletAddress, businessName, email }
    });

    return NextResponse.json(merchant);
  } catch (err: any) {
    console.error("POST merchant error:", err);
    return NextResponse.json({ error: "Failed to save merchant" }, { status: 500 });
  }
}
