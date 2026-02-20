export type SettingsPreferences = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  messageNotifications: boolean;
  newListingNotifications: boolean;
  showEmail: boolean;
};

export const defaultSettingsPreferences: SettingsPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  messageNotifications: true,
  newListingNotifications: false,
  showEmail: false,
};
