import { keccak256, toUtf8Bytes } from "ethers";

/**
 * Deterministic JSON: object keys sorted, no whitespace.
 * The admin dashboard, scripts and verify page must all use this exact
 * function, or the same metadata will produce different hashes.
 */
export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  switch (typeof value) {
    case "string":
    case "boolean":
      return JSON.stringify(value);
    case "number":
      if (!Number.isFinite(value)) throw new Error("Non-finite numbers are not allowed in metadata");
      return JSON.stringify(value);
    case "object": {
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
      return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(",")}}`;
    }
    default:
      throw new Error(`Unsupported value in metadata: ${typeof value}`);
  }
}

/** keccak256 of the canonical JSON, as a 0x-prefixed bytes32 hex string. */
export function contentHashOf(metadata: unknown): string {
  return keccak256(toUtf8Bytes(canonicalize(metadata)));
}
