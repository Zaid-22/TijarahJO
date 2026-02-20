export type CreateUserForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: "admin" | "user";
};

export const initialCreateUserForm: CreateUserForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  role: "user",
};
