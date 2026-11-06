// Utility functions and constants for Job Posting Form

export const formatLocalDateYMD = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateStr = (dateVal) => {
  if (!dateVal) return "";
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (trimmed.includes('T')) return trimmed.split('T')[0];
    if (trimmed.includes(' ')) return trimmed.split(' ')[0];
    return trimmed;
  }
  if (dateVal instanceof Date) {
    return formatLocalDateYMD(dateVal);
  }
  return String(dateVal).split('T')[0].split(' ')[0].trim();
};

export const academicDegrees = ["ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"];
export const supportDegrees = [
  "มัธยมศึกษาตอนปลาย (ม.6)",
  "ประกาศนียบัตรวิชาชีพ (ปวช.)",
  "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)",
  "อนุปริญญา",
  "ปริญญาตรี",
  "ปริญญาโท",
  "ปริญญาเอก"
];

export const sanitizeText = (val, maxLen = 100) => {
  return String(val || '').replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s\.\(\)\/\-\_\,\:]/g, '').slice(0, maxLen);
};

export const sanitizeNumberOnly = (val, maxLen = 3) => {
  return String(val || '').replace(/\D/g, '').slice(0, maxLen);
};

export const sanitizeSalary = (val) => {
  return String(val || '').replace(/[^\d\,]/g, '').slice(0, 15);
};
