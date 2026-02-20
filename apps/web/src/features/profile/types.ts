export interface ProfilePageUserProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  city?: string;
  area?: string;
  bio: string;
  avatar?: string;
  joinedDate: string;
}

export interface EditProfileFormProfile {
  id: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  location: string;
  bio: string;
  avatar?: string;
  joinedDate: string;
}

export interface EditProfileValidationErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  area?: string;
}
