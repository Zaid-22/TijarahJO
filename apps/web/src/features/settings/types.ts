export type SettingsPreferences = {
  emailNotifications: boolean;
  messageNotifications: boolean;
  newListingNotifications: boolean;
  showEmail: boolean;
};

export const defaultSettingsPreferences: SettingsPreferences = {
  emailNotifications: true,
  messageNotifications: true,
  newListingNotifications: false,
  showEmail: false,
};
