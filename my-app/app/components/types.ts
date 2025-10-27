// src/types.ts

export type ViewType =
  | 'home'
  | 'auth'
  | 'dashboard'
  | 'review'
  | 'rating'
  | 'report';

export type RoleType = 'student' | 'instructor';

export interface UserType {
  id: string;
  email: string;
  role: RoleType;
}
