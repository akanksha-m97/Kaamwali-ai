export const sendOtp = async (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000);

  window.devOtp = otp;

  console.log("🔥 DEV OTP:", otp);

  // Always return the OTP for auto-fill (both dev and production)
  return otp;
};

export const verifyOtp = async (otp) => {
  if (otp === String(window.devOtp)) {
    return { success: true };
  } else {
    throw new Error("Invalid OTP");
  }
};