import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FilesService } from './files.service';
import { FileUploadContext } from './file-storage.service';
import { File } from './domain/file';

/**
 * Session bookkeeping for a single in-flight chunked upload.
 *
 * Kept entirely in memory: chunk-count is small (<= a few thousand), and the
 * expected flow is "start, upload, finish" within minutes. If the process
 * restarts mid-upload the session is lost and the temp directory is eventually
 * garbage-collected by `cleanupStale`.
 */
interface ChunkSession {
  uploadId: string;
  fileName: string;
  totalSize: number;
  mimeType: string;
  context: FileUploadContext;
  chunkSize: number;
  totalChunks: number;
  receivedChunks: Set<number>;
  createdAt: number;
  tmpDir: string;
}

/**
 * Chunked upload service. Used when a single POST of the full file would hit
 * intermediate size limits (Cloudflare free tier caps at 100 MB per request,
 * nginx default `client_max_body_size` is 1 MB). By splitting the file into
 * ~5 MB chunks and POSTing each one separately we stay under every reasonable
 * proxy limit, then reassemble on disk and hand off to the existing
 * `FilesService.uploadFileWithContext` pipeline so the resulting File record
 * is indistinguishable from a direct upload.
 */
@Injectable()
export class ChunkedUploadService implements OnModuleDestroy {
  private readonly logger = new Logger(ChunkedUploadService.name);
  private readonly sessions = new Map<string, ChunkSession>();
  private readonly CHUNK_ROOT = path.resolve(
    process.cwd(),
    'uploads',
    '.chunks',
  );
  // 5 MB per chunk: safely under Cloudflare's 100 MB free-tier request cap and
  // under typical production nginx `client_max_body_size` of 10 MB+. If nginx
  // is at its 1 MB default, raise it to at least 10 MB or chunks will still
  // 413.
  private readonly CHUNK_SIZE = 5 * 1024 * 1024;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000;
  private readonly gcInterval: NodeJS.Timeout;

  constructor(private readonly filesService: FilesService) {
    fs.mkdirSync(this.CHUNK_ROOT, { recursive: true });
    this.gcInterval = setInterval(
      () => this.cleanupStale(),
      60 * 60 * 1000,
    );
    // Prevent the interval from keeping the event loop alive on graceful
    // shutdown / test runs.
    this.gcInterval.unref?.();
  }

  onModuleDestroy(): void {
    clearInterval(this.gcInterval);
  }

  /**
   * Create a new upload session, validate the request against the class-file
   * rules (extension, max size), and return the chunk sizing the client
   * should use.
   */
  init(params: {
    fileName: string;
    totalSize: number;
    mimeType: string;
    context: FileUploadContext;
  }): { uploadId: string; chunkSize: number; totalChunks: number } {
    if (!Number.isFinite(params.totalSize) || params.totalSize <= 0) {
      throw new BadRequestException('Invalid file size');
    }
    if (params.totalSize > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size ${(params.totalSize / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(this.MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`,
      );
    }
    if (!/\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i.test(params.fileName)) {
      throw new BadRequestException('Unsupported video format');
    }

    const uploadId = uuidv4();
    const chunkSize = this.CHUNK_SIZE;
    const totalChunks = Math.ceil(params.totalSize / chunkSize);
    const tmpDir = path.join(this.CHUNK_ROOT, uploadId);
    fs.mkdirSync(tmpDir, { recursive: true });

    this.sessions.set(uploadId, {
      uploadId,
      fileName: params.fileName,
      totalSize: params.totalSize,
      mimeType: params.mimeType,
      context: params.context,
      chunkSize,
      totalChunks,
      receivedChunks: new Set(),
      createdAt: Date.now(),
      tmpDir,
    });

    this.logger.log(
      `init upload ${uploadId} file=${params.fileName} size=${params.totalSize} chunks=${totalChunks}`,
    );

    return { uploadId, chunkSize, totalChunks };
  }

  /**
   * Write a single chunk to disk. Chunks can arrive out-of-order.
   *
   * Returns progress so the client can double-check its view of the upload.
   */
  async appendChunk(params: {
    uploadId: string;
    chunkIndex: number;
    chunkBuffer: Buffer;
  }): Promise<{ received: number; total: number }> {
    const session = this.sessions.get(params.uploadId);
    if (!session) {
      throw new NotFoundException('Upload session not found or expired');
    }
    if (
      !Number.isInteger(params.chunkIndex) ||
      params.chunkIndex < 0 ||
      params.chunkIndex >= session.totalChunks
    ) {
      throw new BadRequestException(
        `Invalid chunk index ${params.chunkIndex}; expected 0..${session.totalChunks - 1}`,
      );
    }

    // Validate chunk size: every chunk except the last must equal chunkSize,
    // and the last must equal (totalSize - chunkSize * (totalChunks - 1)).
    const isLastChunk = params.chunkIndex === session.totalChunks - 1;
    const expectedSize = isLastChunk
      ? session.totalSize - session.chunkSize * (session.totalChunks - 1)
      : session.chunkSize;
    if (params.chunkBuffer.length !== expectedSize) {
      throw new BadRequestException(
        `Chunk ${params.chunkIndex} size ${params.chunkBuffer.length} does not match expected ${expectedSize}`,
      );
    }

    const chunkPath = path.join(session.tmpDir, `${params.chunkIndex}.part`);
    await fs.promises.writeFile(chunkPath, params.chunkBuffer);
    session.receivedChunks.add(params.chunkIndex);

    return {
      received: session.receivedChunks.size,
      total: session.totalChunks,
    };
  }

  /**
   * Assemble chunks into a single file and hand off to the standard file
   * pipeline. Cleans up the temp directory on success or failure.
   *
   * NOTE: The current FilesService.uploadFileWithContext path expects
   * file.buffer, so we load the assembled file into memory once. That matches
   * existing behavior for direct uploads; if you need to support files
   * materially larger than available RAM, plumb a streaming path through
   * FileStorageService.
   */
  async complete(params: {
    uploadId: string;
    userId: string | number;
  }): Promise<File> {
    const session = this.sessions.get(params.uploadId);
    if (!session) {
      throw new NotFoundException('Upload session not found or expired');
    }
    if (session.receivedChunks.size !== session.totalChunks) {
      throw new BadRequestException(
        `Missing chunks: received ${session.receivedChunks.size}/${session.totalChunks}`,
      );
    }

    const assembledPath = path.join(session.tmpDir, 'assembled');

    try {
      await this.assembleChunks(session, assembledPath);

      const stats = await fs.promises.stat(assembledPath);
      if (stats.size !== session.totalSize) {
        throw new BadRequestException(
          `Assembled file size ${stats.size} does not match declared total ${session.totalSize}`,
        );
      }

      const buffer = await fs.promises.readFile(assembledPath);
      const fakeMulterFile = {
        fieldname: 'file',
        originalname: session.fileName,
        encoding: '7bit',
        mimetype: session.mimeType,
        size: buffer.length,
        buffer,
        destination: '',
        filename: session.fileName,
        path: assembledPath,
        stream: null,
      } as unknown as Express.Multer.File;

      const result = await this.filesService.uploadFileWithContext(
        fakeMulterFile,
        { ...session.context, userId: params.userId },
      );

      this.logger.log(
        `complete upload ${params.uploadId} fileId=${result.id} size=${session.totalSize}`,
      );

      return result;
    } finally {
      await this.cleanup(params.uploadId);
    }
  }

  async abort(uploadId: string): Promise<void> {
    await this.cleanup(uploadId);
  }

  /**
   * Stream-concatenate every chunk into a single file. We avoid loading the
   * whole thing into memory at this stage.
   */
  private async assembleChunks(
    session: ChunkSession,
    destPath: string,
  ): Promise<void> {
    const writeStream = fs.createWriteStream(destPath);
    try {
      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = path.join(session.tmpDir, `${i}.part`);
        if (!fs.existsSync(chunkPath)) {
          throw new BadRequestException(`Chunk ${i} missing from disk`);
        }
        await new Promise<void>((resolve, reject) => {
          const readStream = fs.createReadStream(chunkPath);
          readStream.on('error', reject);
          readStream.on('end', resolve);
          readStream.pipe(writeStream, { end: false });
        });
      }
    } finally {
      await new Promise<void>((resolve) => writeStream.end(() => resolve()));
    }
  }

  private async cleanup(uploadId: string): Promise<void> {
    const session = this.sessions.get(uploadId);
    this.sessions.delete(uploadId);
    const tmpDir = session?.tmpDir ?? path.join(this.CHUNK_ROOT, uploadId);
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch (err) {
      this.logger.warn(
        `Failed to remove chunk dir for ${uploadId}: ${(err as Error).message}`,
      );
    }
  }

  private cleanupStale(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.createdAt > this.SESSION_TTL_MS) {
        void this.cleanup(id);
      }
    }
  }
}
