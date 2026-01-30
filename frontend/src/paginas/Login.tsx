import { useState } from "react";
import api from "../api/api";
import "../estilos/login.css";

const Login = () => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");

    try {
      const respuesta = await api.post("/autenticacion/login", {
        correo,
        contrasena,
      });

      const { token, usuario } = respuesta.data;

      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      setMensaje(`Bienvenido ${usuario.nombre} (${usuario.rol})`);
      window.location.reload();

    } catch {
      setMensaje("❌ Credenciales incorrectas");
    }
  };

  return (
    <div className="login-contenedor">
      <div className="login-card">
        <h2>Iniciar Sesión</h2>

        <form onSubmit={iniciarSesion}>
          <input
            className="login-input"
            type="email"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <input
            className="login-input"
            type="password"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />

          <button className="login-boton" type="submit">
            Ingresar
          </button>
        </form>

        {mensaje && <p className="login-mensaje">{mensaje}</p>}
      </div>
    </div>
  );
};

export default Login;
