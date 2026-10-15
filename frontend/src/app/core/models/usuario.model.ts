export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginResponse {
  mensaje: string;
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  password: string;
};