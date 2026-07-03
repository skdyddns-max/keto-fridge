/**
 * 사용자 음식 사진 저장 — IndexedDB (백엔드 0, 오프라인 유지).
 * 사진은 업로드 시 자동 리사이즈·JPEG 압축해 Blob으로 보관한다.
 */
const DB_NAME = "keto-fridge";
const STORE = "photos";
const VERSION = 1;

export interface Photo {
  id: number;
  recipeId: string;
  blob: Blob;
  at: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        os.createIndex("recipeId", "recipeId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE, mode).objectStore(STORE);
}

/** 파일을 최대 변 maxDim로 리사이즈 + JPEG 압축 */
export async function compressImage(file: File, maxDim = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 미지원");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("압축 실패"))), "image/jpeg", quality),
  );
}

export async function addPhoto(recipeId: string, blob: Blob): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readwrite").add({ recipeId, blob, at: Date.now() });
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getPhotos(recipeId: string): Promise<Photo[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readonly").index("recipeId").getAll(recipeId);
    req.onsuccess = () => resolve((req.result as Photo[]).sort((a, b) => a.at - b.at));
    req.onerror = () => reject(req.error);
  });
}

export async function deletePhoto(id: number): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readwrite").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** 사진이 1장 이상 있는 레시피 id 집합 (카드 배지용) */
export async function recipeIdsWithPhotos(): Promise<Set<string>> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const set = new Set<string>();
    const req = tx(db, "readonly").index("recipeId").openKeyCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) {
        set.add(cur.key as string);
        cur.continue();
      } else resolve(set);
    };
    req.onerror = () => reject(req.error);
  });
}
