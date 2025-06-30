import { getDebugInfo } from "@/lib/api";
import { cacheService } from "@/lib/cache-service";
import { logWithTimestamp } from '@/lib/utils';
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "stats": {
        const cacheStats = await cacheService.getStats();
        const debugInfo = getDebugInfo();
        return NextResponse.json({
          cache: cacheStats,
          ...debugInfo,
        });
      }

      case "queue-stats": {
        const queueStats = cacheService.getQueueStats();
        const rateLimitStats = cacheService.getRateLimitStats();
        return NextResponse.json({
          queueStats,
          rateLimitStats,
        });
      }

      case "clear": {
        await cacheService.clear();
        return NextResponse.json({ message: "Cache cleared successfully" });
      }

      case "rate-limits": {
        return NextResponse.json(getDebugInfo());
      }

      default: {
        return NextResponse.json({
          message: "Cache API - use ?action=stats, ?action=queue-stats, ?action=clear, or ?action=rate-limits",
          availableActions: ["stats", "queue-stats", "clear", "rate-limits"],
        });
      }
    }
  } catch (error) {
    logWithTimestamp('error', "Cache API error:", error);
    return NextResponse.json(
      { error: "Failed to process cache request" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await cacheService.clear();
    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully"
    });
  } catch (error) {
    logWithTimestamp('error', "Error clearing cache:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
} 