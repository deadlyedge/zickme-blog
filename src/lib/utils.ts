import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//写一个方法来处理类型问题，从一个复合类型如'number | T'中剔除'number'
// export type ExcludeNumber<T> = T extends number ? never : T

/**
 * 从 cover 对象中安全提取 URL，确保返回 string | null
 */
export function getCoverUrl(cover: unknown): string | null {
  if (cover && typeof cover === 'object' && 'url' in cover) {
    const url = (cover as { url: unknown }).url
    if (typeof url === 'string' && url.trim() !== '') {
      return url
    }
  }
  return null
}

/**
 * 从联合类型如 'number | T' 中剔除 'number'，返回 T | null
 * 用于处理 Payload depth 不足时关联字段返回 ID 的情况
 */
export type ExcludeNumber<T> = T extends number ? never : T

export function safeExtract<T>(value: T): ExcludeNumber<T> | null {
  return typeof value === 'number' ? null : (value as ExcludeNumber<T>) || null
}
