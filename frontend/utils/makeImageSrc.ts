// utils/makeImageSrc.ts
export const makeImageSrc = (val?: string | null): string => {
  if (!val) return '';
  if (val.startsWith('http')) return val; // full URL
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${val}`;
};


export const makeImageSrcEmployee = (val?: string | null): string => {
  if (!val) return "";
  if (val.startsWith("http")) return val;
  return `http://localhost:5000/images/employee/${val}`;
};
