// Phone-number check. PLACEHOLDER: the code is always 1111 until an SMS provider is chosen.
// To go live with a real provider, only change sendOtp and checkOtp (call your backend / provider there).
export const OTP_TEST_MODE = true;
export async function sendOtp(phone) { return { ok: true }; }
export async function checkOtp(phone, code) { return String(code).trim() === '1111'; }
