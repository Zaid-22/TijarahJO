export type CreateUserForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  roleId: string;
};

export const initialCreateUserForm: CreateUserForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  roleId: "",
};
