// Mock Users Data with Unique IDs
import { User } from "../types";

export const mockUsers: User[] = [
  {
    id: "user_1734600000000_a1b2c",
    email: "ahmed.k@example.com",
    username: "ahmedk",
    firstName: "Ahmed",
    lastName: "Khaled",
    name: "Ahmed Khaled",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    role: "user",
  },
  {
    id: "user_1734600001000_d3e4f",
    email: "sara.m@example.com",
    username: "saram",
    firstName: "Sara",
    lastName: "Mansour",
    name: "Sara Mansour",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    role: "user",
  },
  {
    id: "user_1734600002000_g5h6i",
    email: "omar.h@example.com",
    username: "omarh",
    firstName: "Omar",
    lastName: "Hassan",
    name: "Omar Hassan",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    role: "user",
  },
  {
    id: "user_1734600003000_j7k8l",
    email: "lina.a@example.com",
    username: "linaa",
    firstName: "Lina",
    lastName: "Ahmad",
    name: "Lina Ahmad",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    role: "user",
  },
  {
    id: "user_1734600004000_m9n0o",
    email: "khaled.s@example.com",
    username: "khaleds",
    firstName: "Khaled",
    lastName: "Salem",
    name: "Khaled Salem",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    role: "user",
  },
  {
    id: "user_1734600005000_p1q2r",
    email: "fatima.r@example.com",
    username: "fatimar",
    firstName: "Fatima",
    lastName: "Rahman",
    name: "Fatima Rahman",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    role: "user",
  },
  {
    id: "user_1734600006000_s3t4u",
    email: "yousef.t@example.com",
    username: "youseft",
    firstName: "Yousef",
    lastName: "Tamer",
    name: "Yousef Tamer",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop",
    role: "user",
  },
  {
    id: "user_1734600007000_v5w6x",
    email: "noor.z@example.com",
    username: "noorz",
    firstName: "Noor",
    lastName: "Zaki",
    name: "Noor Zaki",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
    role: "user",
  },
  {
    id: "user_1734600008000_y7z8a",
    email: "ali.m@example.com",
    username: "alim",
    firstName: "Ali",
    lastName: "Mustafa",
    name: "Ali Mustafa",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop",
    role: "user",
  },
  {
    id: "user_1734600009000_b9c0d",
    email: "rami.k@example.com",
    username: "ramik",
    firstName: "Rami",
    lastName: "Karim",
    name: "Rami Karim",
    avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=200&h=200&fit=crop",
    role: "user",
  },
];

// Helper function to get user by ID
export function getUserById(id: string): User | undefined {
  return mockUsers.find(user => user.id === id);
}

// Helper function to get user by email
export function getUserByEmail(email: string): User | undefined {
  return mockUsers.find(user => user.email === email);
}

// Helper function to get user by username
export function getUserByUsername(username: string): User | undefined {
  return mockUsers.find(user => user.username === username);
}
