const env = import.meta.env as Record<string, string | undefined>;

const toArray = (keys: string | string[]) => (Array.isArray(keys) ? keys : [keys]);

export const getEnvValue = (keys: string | string[]) => {
  for (const key of toArray(keys)) {
    const value = env[key] ?? process.env[key];
    if (value !== undefined) {
      return String(value);
    }
  }
  return undefined;
};

export const getBooleanEnv = (keys: string | string[], defaultValue = true) => {
  const raw = getEnvValue(keys);
  if (raw === undefined) return defaultValue;
  return !['false', '0', 'off', 'no'].includes(raw.trim().toLowerCase());
};
