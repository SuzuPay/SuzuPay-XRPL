import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantAddress, amount, currency, description, expiresAt } = body;

    if (!merchantAddress || !amount || !currency || !expiresAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the merchant first
    const merchant = await prisma.merchant.findUnique({
      where: { walletAddress: merchantAddress }
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        merchantId: merchant.id,
        amount,
        currency,
        description,
        expiresAt: new Date(expiresAt),
        status: "pending"
      }
    });

    return NextResponse.json(paymentRequest);
  } catch (err: any) {
    console.error("POST PaymentRequest error:", err);
    return NextResponse.json({ error: "Failed to create payment request" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantAddress = searchParams.get('merchantAddress');

    if (!merchantAddress) {
      return NextResponse.json({ error: "merchantAddress required" }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { walletAddress: merchantAddress },
      include: {
        paymentRequests: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
    }

    return NextResponse.json({ paymentRequests: merchant.paymentRequests });
  } catch (err: any) {
    console.error("GET PaymentRequests error:", err);
    return NextResponse.json({ error: "Failed to fetch payment requests" }, { status: 500 });
  }
}
