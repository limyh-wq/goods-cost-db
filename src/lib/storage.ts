import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * 파일 스토리지 추상화.
 * 현재는 로컬 디스크 구현만 있으나, 동일 인터페이스로 S3/Supabase 등으로 교체 가능.
 * 라우트/서비스는 절대 fs 를 직접 호출하지 말고 이 모듈만 사용한다.
 */

export interface SaveResult {
  storageKey: string;
  fileUrl: string;
  sizeBytes: number;
}

export interface StorageProvider {
  save(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

const STORAGE_DIR = process.env.LOCAL_STORAGE_DIR || "storage";
const PUBLIC_BASE = process.env.STORAGE_PUBLIC_BASE || "/api/files";

function resolvePath(key: string): string {
  const root = path.resolve(process.cwd(), STORAGE_DIR);
  const target = path.resolve(root, key);
  // 경로 탈출(../) 방지
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error("잘못된 스토리지 경로입니다.");
  }
  return target;
}

class LocalStorageProvider implements StorageProvider {
  async save(key: string, data: Buffer): Promise<void> {
    const target = resolvePath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(resolvePath(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(resolvePath(key));
    } catch (e) {
      // 이미 없으면 무시
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
}

const provider: StorageProvider = new LocalStorageProvider();

/** 파일명에서 위험 문자를 제거 */
function safeFileName(name: string): string {
  return name.replace(/[^\w.\-가-힣() ]+/g, "_").slice(0, 180) || "file";
}

/** 파일 저장 → 스토리지 키와 공개 URL 반환 */
export async function saveUploadedFile(
  prefix: string,
  originalName: string,
  data: Buffer,
): Promise<SaveResult> {
  const key = `${prefix}/${randomUUID()}_${safeFileName(originalName)}`;
  await provider.save(key, data);
  return {
    storageKey: key,
    fileUrl: `${PUBLIC_BASE}/${key}`,
    sizeBytes: data.byteLength,
  };
}

export async function readStoredFile(key: string): Promise<Buffer> {
  return provider.read(key);
}

export async function deleteStoredFile(key: string): Promise<void> {
  return provider.delete(key);
}
