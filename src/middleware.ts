// TODO: Implement the code here to add rate limiting with Redis
// Refer to the Next.js Docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
// Refer to Redis docs on Rate Limiting: https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms

import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Retrieve environment variables for Redis connection
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables must be set"
  );
}

// Initialize Redis instance
const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Create a rate limiter using the Fixed Window algorithm
// Here we allow 10 requests per 10 seconds from the same IP
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(100, "10 s"), // 10 requests per 10 seconds
  analytics: true, // Optional: Enable analytics for debugging or tracking
  timeout: 5000, // Optional: Specify a timeout for the rate limiting algorithm
  prefix: "rate-limit:", // Optional: Specify a prefix for the Redis keys
});

export async function middleware(request: NextRequest) {
  try {
    // Get the IP address from the request or fallback to localhost
    const ip = request.ip || "127.0.0.1";

    // Apply rate limiting using the IP address as a unique identifier
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    console.log(`Rate limiting result for IP ${ip}: ${success ? "allowed" : "exceeded"}`);

    if (!success) {
      // Rate limit exceeded - respond with 429 Too Many Requests
      return NextResponse.json(
        {
          message: "Too many requests. Please try again later.",
          limit,
          remaining,
          reset,
        },
        { status: 429 }
      );
    }

    // Request allowed - proceed to the next middleware or endpoint
    const response = NextResponse.next();

    // Add rate limit headers to the response for client awareness
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());

    return response;
  } catch (error) {
    console.error("Rate Limiting Middleware Error:", error);

    // Fallback: Respond with a 500 Internal Server Error
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}