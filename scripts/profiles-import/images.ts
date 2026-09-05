import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { GALLERY_MAX } from "./fields";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAIN_CANDIDATES = ["main.jpg", "main.jpeg", "main.webp", "main.png"];

export interface ImagePlan {
  folder: string;
  main?: { filename: string; absPath: string };
  gallery: { filename: string; absPath: string }[];
  allCount: number;
  errors: string[];
}

function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

export function planImages(imagesRoot: string, folderName: string): ImagePlan {
  const errors: string[] = [];
  const trimmed = folderName.trim();
  if (!trimmed) {
    return { folder: trimmed, gallery: [], allCount: 0, errors: ["image_folder is empty"] };
  }
  if (trimmed.includes("..") || path.isAbsolute(trimmed)) {
    return { folder: trimmed, gallery: [], allCount: 0, errors: ["image_folder must be a relative folder name, not a path"] };
  }

  const folder = path.resolve(imagesRoot, trimmed);
  let entries: string[] = [];
  try {
    if (!statSync(folder).isDirectory()) {
      return { folder, gallery: [], allCount: 0, errors: [`image folder is not a directory: ${folder}`] };
    }
    entries = readdirSync(folder);
  } catch {
    return { folder, gallery: [], allCount: 0, errors: [`image folder not found: ${folder}`] };
  }

  const files = entries.filter((name) => {
    try {
      return statSync(path.join(folder, name)).isFile() && isImageFile(name);
    } catch {
      return false;
    }
  });

  const byLower = new Map(files.map((name) => [name.toLowerCase(), name]));
  let mainName: string | undefined;
  for (const candidate of MAIN_CANDIDATES) {
    const found = byLower.get(candidate);
    if (found) {
      mainName = found;
      break;
    }
  }

  const galleryNames = files
    .filter((name) => name !== mainName)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  if (!mainName) {
    errors.push(`missing main image (expected main.jpg, main.jpeg, main.webp, or main.png) in ${folder}`);
  }
  if (galleryNames.length > GALLERY_MAX) {
    errors.push(`gallery has ${galleryNames.length} images; maximum is ${GALLERY_MAX}`);
  }

  return {
    folder,
    main: mainName ? { filename: mainName, absPath: path.join(folder, mainName) } : undefined,
    gallery: galleryNames.map((filename) => ({ filename, absPath: path.join(folder, filename) })),
    allCount: files.length,
    errors,
  };
}

export function sha1File(absPath: string): { buffer: Buffer; sha1: string } {
  const buffer = readFileSync(absPath);
  const sha1 = createHash("sha1").update(buffer).digest("hex");
  return { buffer, sha1 };
}
