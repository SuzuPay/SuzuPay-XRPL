import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> }

export async function PUT(
  req: NextRequest,
  context: Context
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const body = await req.json();
    const { status, txHash } = body;

    const paymentRequest = await prisma.paymentRequest.update({
      where: { id },
      data: { 
        status, 
        txHash 
      }
    });

    return NextResponse.json(paymentRequest);
  } catch (err: any) {
    console.error("PUT PaymentRequest error:", err);
    return NextResponse.json({ error: "Failed to update payment request" }, { status: 500 });
  }
}
