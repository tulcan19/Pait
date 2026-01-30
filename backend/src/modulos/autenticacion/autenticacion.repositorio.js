const pool = require("../../config/base_datos");

async function buscarUsuarioPorCorreo(correo) {
  const consulta = `
    SELECT u.id_usuario, u.nombre, u.correo, u.contrasena, u.activo,
           r.id_rol, r.nombre AS rol
    FROM usuarios u
    INNER JOIN roles r ON r.id_rol = u.id_rol
    WHERE u.correo = $1
    LIMIT 1
  `;
  const resultado = await pool.query(consulta, [correo]);
  return resultado.rows[0];
}

module.exports = {
  buscarUsuarioPorCorreo,
};
