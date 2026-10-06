export function validatePAN(pan: string): boolean {
  if (!pan) return false;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
}

export function validateGSTN(gstn: string): boolean {
  if (!gstn) return false;
  const gstnRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstnRegex.test(gstn.trim().toUpperCase());
}

export function validateIFSC(ifsc: string): boolean {
  if (!ifsc) return false;
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc.trim().toUpperCase());
}

export function validateMobile(mobile: string): boolean {
  if (!mobile) return false;
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile.trim().replace(/[\s-]/g, ''));
}

export function maskBankAccount(accountNumber: string): string {
  if (!accountNumber) return '';
  const clean = accountNumber.trim();
  if (clean.length <= 4) return clean;
  const lastFour = clean.slice(-4);
  return `•••• •••• ${lastFour}`;
}
