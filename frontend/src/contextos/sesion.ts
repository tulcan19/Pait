export type Rol = "Administrador" | "Operador" | "Supervisor";

export function obtenerUsuario() {
  const u = localStorage.getItem("usuario");
  return u ? JSON.parse(u) : null;
}

export function obtenerRol(): Rol | null {
  const u = obtenerUsuario();
  return u?.rol || null;
}

export function esAdmin() {
  return obtenerRol() === "Administrador";
}

export function esOperador() {
  return obtenerRol() === "Operador";
}

export function esSupervisor() {
  return obtenerRol() === "Supervisor";
}
