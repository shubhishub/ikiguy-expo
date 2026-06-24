import { describe, expect, it } from 'bun:test';

import { ChunkUploader } from './chunk-uploader';

const noSleep = () => Promise.resolve();

describe('ChunkUploader', () => {
  it('uploads every enqueued chunk in order', async () => {
    const seen: number[] = [];
    const up = new ChunkUploader(async (index) => {
      seen.push(index);
    }, { sleep: noSleep });

    up.enqueue(0, 'a');
    up.enqueue(1, 'b');
    up.enqueue(2, 'c');
    await up.flush();

    expect(seen).toEqual([0, 1, 2]);
    expect(up.uploaded).toBe(3);
    expect(up.failed).toBe(0);
  });

  it('retries a failing chunk, then succeeds', async () => {
    let attempts = 0;
    const up = new ChunkUploader(async () => {
      attempts++;
      if (attempts < 3) throw new Error('flaky network');
    }, { sleep: noSleep, maxRetries: 3 });

    up.enqueue(0, 'a');
    await up.flush();

    expect(attempts).toBe(3);
    expect(up.uploaded).toBe(1);
    expect(up.failed).toBe(0);
  });

  it('counts a chunk that fails past maxRetries as failed', async () => {
    const up = new ChunkUploader(async () => {
      throw new Error('always down');
    }, { sleep: noSleep, maxRetries: 2 });

    up.enqueue(0, 'a');
    await up.flush();

    expect(up.uploaded).toBe(0);
    expect(up.failed).toBe(1);
    expect(up.lastError).toBe('always down');
  });

  it('flush resolves for chunks enqueued after an idle period', async () => {
    let count = 0;
    const up = new ChunkUploader(async () => {
      count++;
    }, { sleep: noSleep });

    up.enqueue(0, 'a');
    await up.flush();
    up.enqueue(1, 'b'); // enqueued after the queue drained once
    await up.flush();

    expect(count).toBe(2);
    expect(up.uploaded).toBe(2);
  });

  it('flush is a no-op when nothing was enqueued', async () => {
    const up = new ChunkUploader(async () => {}, { sleep: noSleep });
    await expect(up.flush()).resolves.toBeUndefined();
  });
});
