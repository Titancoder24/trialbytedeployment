export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  company?: string;
  designation?: string;
  phone?: string;
  country?: string;
  region?: string;
  sex?: string;
  age?: number;
  plan?: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  company?: string;
  designation?: string;
  phone?: string;
  country?: string;
  region?: string;
  sex?: string;
  age?: number;
  plan?: string;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}
