import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Mobile OSes can't record mp3 directly (iOS does AAC/M4A or WAV, Android does
// AAC/AMR/OGG). Gemini's documented audio formats are wav/mp3/aac/flac/ogg, so
// we transcode each recorded chunk to real mp3 here before sending it on.

let ffmpegOk: boolean | null = null;

async function hasFfmpeg(): Promise<boolean> {
  if (ffmpegOk !== null) return ffmpegOk;
  try {
    const p = Bun.spawn(['ffmpeg', '-version'], { stdout: 'ignore', stderr: 'ignore' });
    await p.exited;
    ffmpegOk = p.exitCode === 0;
  } catch {
    ffmpegOk = false;
  }
  return ffmpegOk;
}

// Convert an audio buffer to mono 16 kHz mp3. Falls back to the original bytes
// (as audio/mp4) if ffmpeg is missing or the conversion fails, so the pipeline
// never hard-crashes on transcoding.
export async function toMp3(
  input: Buffer,
  inputExt = 'm4a',
): Promise<{ data: Buffer; mimeType: string }> {
  if (!(await hasFfmpeg())) return { data: input, mimeType: 'audio/mp4' };

  // mp4/m4a needs a seekable input (moov atom), so write a temp file rather
  // than piping stdin.
  const id = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const inPath = join(tmpdir(), `ikiguy-${id}.${inputExt}`);
  await Bun.write(inPath, input);
  try {
    const proc = Bun.spawn(
      ['ffmpeg', '-y', '-i', inPath, '-vn', '-ar', '16000', '-ac', '1', '-b:a', '64k', '-f', 'mp3', 'pipe:1'],
      { stdout: 'pipe', stderr: 'ignore' },
    );
    const out = Buffer.from(await new Response(proc.stdout).arrayBuffer());
    await proc.exited;
    if (proc.exitCode !== 0 || out.length === 0) return { data: input, mimeType: 'audio/mp4' };
    return { data: out, mimeType: 'audio/mp3' };
  } catch {
    return { data: input, mimeType: 'audio/mp4' };
  } finally {
    unlink(inPath).catch(() => {});
  }
}
