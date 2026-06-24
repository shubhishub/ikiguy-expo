// Background uploader for audio chunks. Segments are enqueued as they finish
// recording and uploaded one at a time with retry, so a slow/flaky network
// never blocks recording. The upload function is injected, which keeps this
// module pure and unit-testable (no expo/network imports).

export type UploadFn = (index: number, uri: string) => Promise<unknown>;

export type ChunkUploaderOpts = {
  maxRetries?: number;
  retryDelayMs?: number;
  // Injectable for deterministic tests.
  sleep?: (ms: number) => Promise<void>;
};

export class ChunkUploader {
  enqueued = 0;
  uploaded = 0;
  failed = 0;
  lastError: string | null = null;

  private queue: { index: number; uri: string }[] = [];
  private active = false;
  private waiters: (() => void)[] = [];
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly uploadFn: UploadFn, opts: ChunkUploaderOpts = {}) {
    this.maxRetries = opts.maxRetries ?? 3;
    this.retryDelayMs = opts.retryDelayMs ?? 1000;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  // Queue a chunk and kick off draining (fire-and-forget).
  enqueue(index: number, uri: string): void {
    this.queue.push({ index, uri });
    this.enqueued++;
    void this.drain();
  }

  // Resolves once every enqueued chunk has been uploaded or permanently failed.
  async flush(): Promise<void> {
    if (!this.active && this.queue.length === 0) return;
    await new Promise<void>((resolve) => this.waiters.push(resolve));
    // More may have been enqueued while we waited.
    if (this.active || this.queue.length) return this.flush();
  }

  private async drain(): Promise<void> {
    if (this.active) return;
    this.active = true;
    try {
      while (this.queue.length) {
        await this.attempt(this.queue.shift()!);
      }
    } finally {
      this.active = false;
      const waiters = this.waiters;
      this.waiters = [];
      for (const resolve of waiters) resolve();
    }
  }

  private async attempt(item: { index: number; uri: string }): Promise<void> {
    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        await this.uploadFn(item.index, item.uri);
        this.uploaded++;
        return;
      } catch (e) {
        if (i === this.maxRetries) {
          this.failed++;
          this.lastError = e instanceof Error ? e.message : String(e);
          return;
        }
        await this.sleep(this.retryDelayMs * (i + 1));
      }
    }
  }
}
