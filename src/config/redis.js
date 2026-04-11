import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME,   
  password: process.env.REDIS_PASSWORD,   

  maxRetriesPerRequest: null,

  retryStrategy: (times) => {
    console.log(`Redis retry attempt: ${times}`);
    return Math.min(times * 100, 3000);
  },
});

redis.on("connect", () => {
  console.log(" Redis connected");
});

redis.on("error", (err) => {
  console.error(" Redis error:", err.message);
});

export default redis;