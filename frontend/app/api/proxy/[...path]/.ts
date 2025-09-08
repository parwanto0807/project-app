import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  const targetUrl = `http://localhost:5000/images/${(path as string[]).join("/")}`;

  const response = await fetch(targetUrl);
  const buffer = await response.arrayBuffer();

  res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
  res.send(Buffer.from(buffer));
}
