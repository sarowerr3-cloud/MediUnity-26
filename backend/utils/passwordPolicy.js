export const isValidPassword = (password) => {
  // Enforce minimum 8 chars, mixed case, number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};
