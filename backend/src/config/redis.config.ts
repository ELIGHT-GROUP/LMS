/**
 * Redis Configuration
 * ===================
 * Redis client configuration for caching and session management
 */

import Redis, { Cluster, ClusterOptions, RedisOptions } from "ioredis";
import logger from "../utils/logger";

let redisClient: Redis | Cluster | null = null;

/**
 * Get Redis configuration from environment
 */
const getRedisConfig = (): RedisOptions | ClusterOptions => {
  const mode = process.env.REDIS_MODE || "standalone";

  if (mode === "cluster") {
    // Cluster mode configuration
    const clusterNodes = process.env.REDIS_CLUSTER_NODES?.split(",") || [];

    if (clusterNodes.length === 0) {
      throw new Error("REDIS_CLUSTER_NODES environment variable is required for cluster mode");
    }

    const nodes = clusterNodes.map((node) => {
      const [host, port] = node.split(":");
      return { host, port: parseInt(port, 10) };
    });

    const clusterOptions: ClusterOptions = {
      redisOptions: {
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === "true" ? {} : undefined,
      },
      clusterRetryStrategy: (times: number) => {
        const delay = Math.min(100 + times * 50, 2000);
        return delay;
      },
    };

    return { nodes, ...clusterOptions } as ClusterOptions;
  } else {
    // Standalone mode configuration
    const redisOptions: RedisOptions = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0", 10),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    };

    if (process.env.REDIS_TLS === "true") {
      redisOptions.tls = {};
    }

    return redisOptions;
  }
};

/**
 * Configure and initialize Redis client
 */
export const configureRedis = (): Redis | Cluster => {
  if (redisClient) {
    logger.warn("Redis client is already configured");
    return redisClient;
  }

  const mode = process.env.REDIS_MODE || "standalone";
  const config = getRedisConfig();

  try {
    if (mode === "cluster") {
      const clusterConfig = config as ClusterOptions & {
        nodes: Array<{ host: string; port: number }>;
      };
      redisClient = new Cluster(clusterConfig.nodes, clusterConfig);
      logger.info("✅ Redis Cluster client initialized");
    } else {
      redisClient = new Redis(config as RedisOptions);
      logger.info("✅ Redis Standalone client initialized");
    }

    // Event handlers
    redisClient.on("connect", () => {
      logger.info("Redis client connected");
    });

    redisClient.on("ready", () => {
      logger.info("Redis client ready");
    });

    redisClient.on("error", (err) => {
      logger.error("Redis client error:", err);
    });

    redisClient.on("close", () => {
      logger.warn("Redis client connection closed");
    });

    redisClient.on("reconnecting", () => {
      logger.info("Redis client reconnecting...");
    });

    return redisClient;
  } catch (error) {
    logger.error("Failed to configure Redis:", error);
    throw error;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): Redis | Cluster => {
  if (!redisClient) {
    return configureRedis();
  }
  return redisClient;
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("✅ Redis connection closed");
  }
};
