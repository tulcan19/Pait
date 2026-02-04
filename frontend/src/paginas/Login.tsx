import { useState } from "react";
import api from "../api/api";
import "../estilos/login.css";

// Constantes de validación
const DOMINIO_PERMITIDO = "@sierrastock.com";
const MIN_PASSWORD_LENGTH = 6;

const Login = () => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error">("error");
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string }>({});

  // Validación del correo
  const validarCorreo = (email: string): string | null => {
    if (!email.trim()) {
      return "El correo es obligatorio";
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Formato de correo inválido";
    }
    
    // Validar dominio @sierrastock.com
    if (!email.toLowerCase().endsWith(DOMINIO_PERMITIDO)) {
      return `Solo se permiten correos con dominio ${DOMINIO_PERMITIDO}`;
    }
    
    return null;
  };

  // Validación de contraseña
  const validarContrasena = (pass: string): string | null => {
    if (!pass) {
      return "La contraseña es obligatoria";
    }
    
    if (pass.length < MIN_PASSWORD_LENGTH) {
      return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
    }
    
    return null;
  };

  // Validar todo el formulario
  const validarFormulario = (): boolean => {
    const nuevoErrores: { correo?: string; contrasena?: string } = {};
    
    const errorCorreo = validarCorreo(correo);
    if (errorCorreo) nuevoErrores.correo = errorCorreo;
    
    const errorContrasena = validarContrasena(contrasena);
    if (errorContrasena) nuevoErrores.contrasena = errorContrasena;
    
    setErrores(nuevoErrores);
    return Object.keys(nuevoErrores).length === 0;
  };

  // Manejar cambio de correo con validación en tiempo real
  const handleCorreoChange = (valor: string) => {
    setCorreo(valor);
    if (errores.correo) {
      const error = validarCorreo(valor);
      setErrores(prev => ({ ...prev, correo: error || undefined }));
    }
  };

  // Manejar cambio de contraseña con validación en tiempo real
  const handleContrasenaChange = (valor: string) => {
    setContrasena(valor);
    if (errores.contrasena) {
      const error = validarContrasena(valor);
      setErrores(prev => ({ ...prev, contrasena: error || undefined }));
    }
  };

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");

    // Validar formulario
    if (!validarFormulario()) {
      return;
    }

    setCargando(true);

    try {
      const respuesta = await api.post("/autenticacion/login", {
        correo: correo.toLowerCase().trim(),
        contrasena,
      });

      const { token, usuario } = respuesta.data;

      // Guardar en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      setMensaje(`Bienvenido ${usuario.nombre}`);
      setTipoMensaje("exito");

      // Recargar después de un pequeño delay para mostrar el mensaje
      setTimeout(() => {
        window.location.reload();
      }, 800);

    } catch (error: any) {
      const mensajeError = error?.response?.data?.mensaje || "Credenciales incorrectas";
      setMensaje(mensajeError);
      setTipoMensaje("error");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-contenedor">
      <div className="login-card">
        {/* Header con logo */}
        <div className="login-header">
          <div className="login-logo">
            🏪
          </div>
          <h2>Sierra Stock</h2>
          <p className="login-subtitulo">Sistema de Gestión Comercial</p>
        </div>

        <form className="login-form" onSubmit={iniciarSesion}>
          {/* Campo correo */}
          <div className="login-campo">
            <label className="login-label" htmlFor="correo">
              Correo electrónico
            </label>
            <div className="login-input-wrapper">
              <input
                id="correo"
                className={`login-input ${errores.correo ? "error" : ""}`}
                type="email"
                 placeholder="ingrese su correo"
                value={correo}
                onChange={(e) => handleCorreoChange(e.target.value)}
                onBlur={() => {
                  const error = validarCorreo(correo);
                  setErrores(prev => ({ ...prev, correo: error || undefined }));
                }}
                disabled={cargando}
                autoComplete="email"
                autoFocus
              />
              {<span className="login-input-icon">📧</span> }
            </div>
            {errores.correo && (
              <span className="login-error-texto">{errores.correo}</span>
            )}
            <div className="login-dominio-info">
              {/* <span>Solo correos @sierrastock.com</span> */}
            </div>
          </div>

          {/* Campo contraseña */}
          <div className="login-campo">
            <label className="login-label" htmlFor="contrasena">
              Contraseña
            </label>
            <div className="login-input-wrapper">
              <input
                id="contrasena"
                className={`login-input ${errores.contrasena ? "error" : ""}`}
                type={mostrarContrasena ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={contrasena}
                onChange={(e) => handleContrasenaChange(e.target.value)}
                onBlur={() => {
                  const error = validarContrasena(contrasena);
                  setErrores(prev => ({ ...prev, contrasena: error || undefined }));
                }}
                disabled={cargando}
                autoComplete="current-password"
              />
              <span className="login-input-icon">🔒</span>
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                tabIndex={-1}
              >
                {mostrarContrasena ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errores.contrasena && (
              <span className="login-error-texto">{errores.contrasena}</span>
            )}
          </div>

          {/* Botón de login */}
          <button 
            className="login-boton" 
            type="submit"
            disabled={cargando}
          >
            {cargando ? (
              <>
                <span className="login-boton-spinner"></span>
                Ingresando...
              </>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>
        </form>

        {/* Mensaje de respuesta */}
        {mensaje && (
          <div className={`login-mensaje ${tipoMensaje}`}>
            {mensaje}
          </div>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-texto">
            Sistema de Gestión para
          </p>
          <span className="login-footer-marca">Sierra Stock</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
