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
  if (!(await hasFfmpeg())) {
    console.warn('[audio] ffmpeg not found — sending original audio to Gemini as audio/mp4');
    return { data: input, mimeType: 'audio/mp4' };
  }

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
    if (proc.exitCode !== 0 || out.length === 0) {
      console.warn(`[audio] ffmpeg failed (exit ${proc.exitCode}), using original ${input.length}B`);
      return { data: input, mimeType: 'audio/mp4' };
    }
    console.log(`[audio] transcoded ${input.length}B ${inputExt} -> ${out.length}B mp3`);
    return { data: out, mimeType: 'audio/mp3' };
  } catch (err) {
    console.error('[audio] transcode error:', err instanceof Error ? err.message : err);
    return { data: input, mimeType: 'audio/mp4' };
  } finally {
    unlink(inPath).catch(() => {});
  }
}

// Combine ordered audio chunks into a single mono 16 kHz mp3 for transcription.
// Each chunk is its own container (separate moov atom), so we concat with
// ffmpeg's concat demuxer + re-encode rather than byte-concatenating. Falls back
// to transcoding just the first chunk if ffmpeg or the concat fails, so finalize
// never hard-crashes.
export async function combineToMp3(
  parts: { buf: Buffer; ext?: string }[],
): Promise<{ data: Buffer; mimeType: string }> {
  if (parts.length === 0) throw Object.assign(new Error('no audio chunks to combine'), { statusCode: 400 });
  if (parts.length === 1) return toMp3(parts[0]!.buf, parts[0]!.ext ?? 'm4a');
  if (!(await hasFfmpeg())) {
    console.warn('[audio] ffmpeg not found — cannot combine chunks, using first chunk only');
    return toMp3(parts[0]!.buf, parts[0]!.ext ?? 'm4a');
  }

  const id = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const dir = tmpdir();
  const partPaths = parts.map((p, i) => join(dir, `ikiguy-${id}-${i}.${p.ext ?? 'm4a'}`));
  const listPath = join(dir, `ikiguy-${id}-list.txt`);
  const cleanup = () => Promise.all([...partPaths, listPath].map((p) => unlink(p).catch(() => {})));

  try {
    await Promise.all(parts.map((p, i) => Bun.write(partPaths[i]!, p.buf)));
    // concat demuxer reads file paths from a list; escape single quotes.
    const list = partPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
    await Bun.write(listPath, list);

    const proc = Bun.spawn(
      ['ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
        '-vn', '-ar', '16000', '-ac', '1', '-b:a', '64k', '-f', 'mp3', 'pipe:1'],
      { stdout: 'pipe', stderr: 'ignore' },
    );
    const out = Buffer.from(await new Response(proc.stdout).arrayBuffer());
    await proc.exited;
    if (proc.exitCode !== 0 || out.length === 0) {
      console.warn(`[audio] concat failed (exit ${proc.exitCode}); falling back to first chunk`);
      return toMp3(parts[0]!.buf, parts[0]!.ext ?? 'm4a');
    }
    console.log(`[audio] combined ${parts.length} chunks -> ${out.length}B mp3`);
    return { data: out, mimeType: 'audio/mp3' };
  } catch (err) {
    console.error('[audio] combine error:', err instanceof Error ? err.message : err);
    return toMp3(parts[0]!.buf, parts[0]!.ext ?? 'm4a');
  } finally {
    cleanup();
  }
}
