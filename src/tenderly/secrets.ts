import type { Secrets } from "@tenderly/actions";

export type ArrayElementType<T> = T extends (infer U)[] ? U : never;

export const getSecrets = <T extends string[]>(
  secrets: Secrets,
  keys: T
): Promise<Record<ArrayElementType<T>, string>> =>
  Promise.all(keys.map(key => secrets.get(key).then(value => [key, value]))).then(
    Object.fromEntries
  );
