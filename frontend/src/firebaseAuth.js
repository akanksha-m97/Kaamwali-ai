export const sendOtp = async (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000);

  window.devOtp = otp;

  console.log("🔥 DEV OTP:", otp);

  return import.meta.env.DEV ? otp : true;
};
export const verifyOtp = async (otp) => {
  if (otp === String(window.devOtp)) {
    return { success: true };
  } else {
    throw new Error("Invalid OTP");
  }
};