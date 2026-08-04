// queues/prescriptionQueue.js
import { Queue } from "bullmq";
import { isRedisAvailable, redisConnection } from "../config/redis.js";
import EventEmitter from "events";

class MockQueue extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
  }
  async add(jobName, data) {
    console.log(`[MOCK QUEUE: ${this.name}] Job queued in-memory:`, jobName);
    setTimeout(() => {
      this.emit("job", { name: jobName, data });
    }, 1000);
    return { id: Math.random().toString(36).substring(7) };
  }
}

let prescriptionQueueInstance;
if (isRedisAvailable) {
  prescriptionQueueInstance = new Queue("prescription-pdf", { connection: redisConnection });
} else {
  prescriptionQueueInstance = new MockQueue("prescription-pdf");
}

export const prescriptionQueue = prescriptionQueueInstance;
