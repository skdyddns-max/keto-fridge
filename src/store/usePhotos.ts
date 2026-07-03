import { useEffect, useRef, useState } from "react";
import { addPhoto, compressImage, deletePhoto, getPhotos } from "../lib/photos";

export interface PhotoView {
  id: number;
  url: string;
}

/** 특정 레시피의 사진 로드·추가·삭제 + object URL 수명 관리 */
export function usePhotos(recipeId: string, onChange?: () => void) {
  const [photos, setPhotos] = useState<PhotoView[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
    setPhotos([]);
    getPhotos(recipeId).then((ps) => {
      if (cancelled) return;
      const views = ps.map((p) => {
        const url = URL.createObjectURL(p.blob);
        urls.current.push(url);
        return { id: p.id, url };
      });
      setPhotos(views);
    });
    return () => {
      cancelled = true;
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
    };
  }, [recipeId]);

  const add = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 첨부할 수 있어요.");
      return;
    }
    setBusy(true);
    try {
      const blob = await compressImage(file);
      const id = await addPhoto(recipeId, blob);
      const url = URL.createObjectURL(blob);
      urls.current.push(url);
      setPhotos((prev) => [...prev, { id, url }]);
      onChange?.();
    } catch {
      setError("사진을 저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    await deletePhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    onChange?.();
  };

  return { photos, add, remove, busy, error };
}
