export type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type PasswordRequirement = {
  label: string;
  met: boolean;
};