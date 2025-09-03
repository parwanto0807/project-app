// app/api/product/generate-code/route.ts
import { NextResponse } from "next/server";
import { generateProductCode } from "@/lib/action/master/product";

export async function GET() {
  const code = await generateProductCode();
  return NextResponse.json({ code });
}
