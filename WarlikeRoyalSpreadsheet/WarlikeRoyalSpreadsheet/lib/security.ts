export const sanitizeText = (value: string, maxLength = 250) => {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLength);
};

export const normalizePhone = (value: string) => value.replace(/[^\d+]/g, '').slice(0, 16);

export const isValidPhone = (value: string) => /^\+?[0-9]{7,15}$/.test(normalizePhone(value));

export const isValidRegion = (value: string) => sanitizeText(value, 80).length >= 2;

export const safeDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};
