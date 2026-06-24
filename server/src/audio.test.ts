import { describe, expect, it } from 'bun:test';

import { combineToMp3 } from './audio.ts';

async function hasFfmpeg(): Promise<boolean> {
  try {
    const p = Bun.spawn(['ffmpeg', '-version'], { stdout: 'ignore', stderr: 'ignore' });
    await p.exited;
    return p.exitCode === 0;
  } catch {
    return false;
  }
}

// Generate a short mono 16 kHz AAC/m4a clip (a sine tone) via ffmpeg, mimicking
// what the recorder uploads as a chunk.
async function makeClip(freq: number, seconds: number): Promise<Buffer> {
  const p = Bun.spawn(
    ['ffmpeg', '-y', '-f', 'lavfi', '-i', `sine=frequency=${freq}:duration=${seconds}`,
      '-ar', '16000', '-ac', '1', '-c:a', 'aac', '-f', 'mp4', '-movflags', 'frag_keyframe+empty_moov', 'pipe:1'],
    { stdout: 'pipe', stderr: 'ignore' },
  );
  const buf = Buffer.from(await new Response(p.stdout).arrayBuffer());
  await p.exited;
  return buf;
}

async function mp3DurationSec(mp3: Buffer): Promise<number> {
  const path = `${Bun.env.TMPDIR ?? '/tmp'}/ikiguy-test-${Date.now()}.mp3`;
  await Bun.write(path, mp3);
  const p = Bun.spawn(
    ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
    { stdout: 'pipe', stderr: 'ignore' },
  );
  const out = (await new Response(p.stdout).text()).trim();
  await p.exited;
  await Bun.spawn(['rm', '-f', path]).exited;
  return parseFloat(out);
}

const ffmpeg = await hasFfmpeg();

describe.skipIf(!ffmpeg)('combineToMp3 (requires ffmpeg)', () => {
  it('combines multiple chunks into one mp3 with the summed duration', async () => {
    const a = await makeClip(440, 1);
    const b = await makeClip(880, 1);
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);

    const { data, mimeType } = await combineToMp3([
      { buf: a, ext: 'm4a' },
      { buf: b, ext: 'm4a' },
    ]);

    expect(mimeType).toBe('audio/mp3');
    expect(data.length).toBeGreaterThan(0);

    const dur = await mp3DurationSec(data);
    // ~2s total, allow generous tolerance for encoder padding.
    expect(dur).toBeGreaterThan(1.5);
    expect(dur).toBeLessThan(3);
  });

  it('handles a single chunk by transcoding it to mp3', async () => {
    const a = await makeClip(440, 1);
    const { data, mimeType } = await combineToMp3([{ buf: a, ext: 'm4a' }]);
    expect(mimeType).toBe('audio/mp3');
    expect(data.length).toBeGreaterThan(0);
  });

  it('throws when given no chunks', async () => {
    await expect(combineToMp3([])).rejects.toThrow();
  });
});
