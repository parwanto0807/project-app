import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params; // harus di-await
    const targetPath = path.join("/");

    const backendUrl = `http://localhost:5000/${targetPath}`;


    const response = await fetch(backendUrl);

    if (!response.ok) {
      console.error("Backend returned:", response.status, response.statusText);
      return new NextResponse("Not Found", { status: 404 });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Proxy Error", { status: 500 });
  }
}
