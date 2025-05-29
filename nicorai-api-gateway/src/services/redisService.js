const { createClient } = require('redis');
const config = require('../config');
 
class RedisService {
  constructor() {
    this.client = null;
    this.isHealthy = true;
    this.init();
  }
 
  async init() {
    try {
      this.client = createClient({
        url: config.redis.url,
        socket: {
          // Enable automatic reconnection with exponential backoff (max 10 seconds)
          reconnectStrategy: (retries) => Math.min(retries * 100, 10000)
        },
        disableClientInfo: true // Disable CLIENT SETINFO command
      });
 
      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err.message);
        this.isHealthy = false;
      });
 
      this.client.on('connect', () => {
        console.log('✅ Redis connected!');
        this.isHealthy = true;
      });
 
      await this.client.connect();
    } catch (err) {
      console.error('❌ Failed to connect to Redis:', err.message);
      this.isHealthy = false;
    }
  }
 
  async get(key) {
    if (!this.isHealthy || !this.client) {
      return null;
    }
 
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error('❌ Redis GET error:', err.message);
      this.isHealthy = false;
      return null;
    }
  }
 
  async set(key, value, options = {}) {
    if (!this.isHealthy || !this.client) {
      return false;
    }
 
    try {
      await this.client.set(key, value, {
        EX: options.ttl || config.redis.ttl
      });
      return true;
    } catch (err) {
      console.error('❌ Redis SET error:', err.message);
      this.isHealthy = false;
      return false;
    }
  }
}
 
module.exports = new RedisService();