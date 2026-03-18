export interface QueueJobOptions {
  attempts?: number;
  backoff?: {
    delay: number;
  };
}

type JobHandler<T> = (payload: T) => Promise<void>;

export class InMemoryQueue<T> {
  private handler?: JobHandler<T>;

  constructor(private readonly queueName: string) {}

  registerHandler(handler: JobHandler<T>): void {
    this.handler = handler;
  }

  async add(jobName: string, payload: T, options: QueueJobOptions = {}): Promise<void> {
    const attempts = Math.max(options.attempts ?? 1, 1);
    const delay = options.backoff?.delay ?? 0;

    const run = async (attemptNumber: number): Promise<void> => {
      try {
        if (!this.handler) {
          throw new Error(`No handler registered for queue ${this.queueName}`);
        }

        await this.handler(payload);
      } catch (error) {
        if (attemptNumber >= attempts) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        await run(attemptNumber + 1);
      }
    };

    void Promise.resolve().then(() => run(1)).catch((error) => {
      console.error(`Queue ${this.queueName} job ${jobName} failed`, error);
    });
  }
}
