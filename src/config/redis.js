import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST, // ❌ no fallback
  port: Number(process.env.REDIS_PORT) || 6379,

  maxRetriesPerRequest: null,

  retryStrategy: (times) => {
    console.log(`🔁 Redis retry attempt: ${times}`);
    return Math.min(times * 100, 3000);
  },
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

export default redis;