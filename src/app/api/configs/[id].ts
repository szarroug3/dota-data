import { Redis } from "@upstash/redis";
import type { NextApiRequest, NextApiResponse } from "next";

const redis = Redis.fromEnv();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;
  if (typeof id !== "string")
    return res.status(400).json({ error: "Invalid id" });

  if (req.method === "GET") {
    const config = await redis.get(`dashboard-config:${id}`);
    if (!config) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(config);
  }
  if (req.method === "POST") {
    const config = req.body;
    await redis.set(`dashboard-config:${id}`, config);
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: "Method not allowed" });
}
