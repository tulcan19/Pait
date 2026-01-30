const bcrypt = require("bcryptjs");
const usuariosRepositorio = require("./usuarios.repositorio");

const ROLES_PERMITIDOS_CREAR = ["Supervisor", "Operador"];
const REGEX_CONTRASENA_FUERTE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/; // min 8, mayus, minus, número y carácter especial

function validarCorreoGmail(correo) {
  if (typeof correo !== "string") return false;
  return correo.toLowerCase().endsWith("@gmail.com");
}

function validarContrasena(contrasena) {
  if (typeof contrasena !== "string") return false;
  return REGEX_CONTRASENA_FUERTE.test(contrasena);
}

async function resolverRol({ id_rol, rol }) {
  if (!id_rol && !rol) {
    return { ok: false, mensaje: "Rol es obligatorio (Supervisor u Operador)" };
  }

  if (rol && !ROLES_PERMITIDOS_CREAR.includes(rol)) {
    return { ok: false, mensaje: "Solo se pueden crear usuarios Supervisor u Operador" };
  }

  if (rol) {
    const rolEncontrado = await usuariosRepositorio.obtenerOCrearRolPorNombre(rol);
    return { ok: true, rol: rolEncontrado };
  }

  const rolPorId = await usuariosRepositorio.obtenerRolPorId(id_rol);
  if (!rolPorId) {
    return { ok: false, mensaje: "Rol no válido en base de datos" };
  }

  if (!ROLES_PERMITIDOS_CREAR.includes(rolPorId.nombre)) {
    return { ok: false, mensaje: "Solo se pueden crear usuarios Supervisor u Operador" };
  }

  return { ok: true, rol: rolPorId };
}

async function registrarUsuario({ nombre, correo, contrasena, id_rol, rol }) {
  if (!validarCorreoGmail(correo)) {
    return {
      ok: false,
      mensaje: "El correo debe ser una cuenta @gmail.com",
    };
  }

  if (!validarContrasena(contrasena)) {
    return {
      ok: false,
      mensaje:
        "La contraseña debe tener mínimo 8 caracteres, con mayúsculas, minúsculas, número y carácter especial.",
    };
  }

  const existe = await usuariosRepositorio.buscarPorCorreo(correo);
  if (existe) {
    return { ok: false, mensaje: "El correo ya está registrado" };
  }

  const rolValidado = await resolverRol({ id_rol, rol });
  if (!rolValidado.ok) {
    return { ok: false, mensaje: rolValidado.mensaje };
  }

  const contrasenaHash = await bcrypt.hash(contrasena, 10);

  const usuarioCreado = await usuariosRepositorio.crearUsuario({
    nombre,
    correo,
    contrasenaHash,
    id_rol: rolValidado.rol.id_rol,
  });

  return { ok: true, usuario: usuarioCreado };
}

async function listarUsuarios() {
  const usuarios = await usuariosRepositorio.listarUsuariosPermitidos();
  return { ok: true, usuarios };
}

async function actualizarUsuario({ id_usuario, nombre, correo, id_rol, rol, contrasena }) {
  if (!id_usuario) return { ok: false, mensaje: "id_usuario es obligatorio" };

  const rolValidado = await resolverRol({ id_rol, rol });
  if (!rolValidado.ok) {
    return { ok: false, mensaje: rolValidado.mensaje };
  }

  if (!validarCorreoGmail(correo)) {
    return {
      ok: false,
      mensaje: "El correo debe ser una cuenta @gmail.com",
    };
  }

  let usuarioActualizado;
  if (contrasena) {
    if (!validarContrasena(contrasena)) {
      return {
        ok: false,
        mensaje:
          "La contraseña debe tener mínimo 8 caracteres, con mayúsculas, minúsculas, número y carácter especial.",
      };
    }
    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    usuarioActualizado = await usuariosRepositorio.actualizarUsuarioConPassword({
      id_usuario,
      nombre,
      correo,
      id_rol: rolValidado.rol.id_rol,
      contrasenaHash,
    });
  } else {
    usuarioActualizado = await usuariosRepositorio.actualizarUsuario({
      id_usuario,
      nombre,
      correo,
      id_rol: rolValidado.rol.id_rol,
    });
  }

  return { ok: true, usuario: usuarioActualizado };
}

async function desactivarUsuario({ id_usuario }) {
  if (!id_usuario) return { ok: false, mensaje: "id_usuario es obligatorio" };
  const usuario = await usuariosRepositorio.desactivarUsuario(id_usuario);
  if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };
  return { ok: true, usuario };
}

async function activarUsuario({ id_usuario }) {
  if (!id_usuario) return { ok: false, mensaje: "id_usuario es obligatorio" };
  const usuario = await usuariosRepositorio.activarUsuario(id_usuario);
  if (!usuario) return { ok: false, mensaje: "Usuario no encontrado" };
  return { ok: true, usuario };
}

async function eliminarUsuario({ id_usuario }) {
  if (!id_usuario) return { ok: false, mensaje: "id_usuario es obligatorio" };
  const eliminado = await usuariosRepositorio.eliminarUsuario(id_usuario);
  if (!eliminado) return { ok: false, mensaje: "Usuario no encontrado" };
  return { ok: true };
}

module.exports = {
  registrarUsuario,
  listarUsuarios,
  actualizarUsuario,
  desactivarUsuario,
  activarUsuario,
  eliminarUsuario,
};
