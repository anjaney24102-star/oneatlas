import { Transform } from 'class-transformer';

/** "a,b,c" | ["a","b"] -> ["a","b","c"] (lower-cased, trimmed, empty removed). */
export const CsvArray = () =>
  Transform(({ value }) => {
    const arr = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : value;
    return Array.isArray(arr) ? arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean) : arr;
  });

export const ToUpper = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value));

export const ToBool = () =>
  Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1') return true;
    if (value === 'false' || value === false || value === '0') return false;
    return value;
  });

export const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
