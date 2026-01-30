import { useState } from "react";
import Login from "./paginas/Login";
import Dashboard from "./paginas/Dashboard";

function App() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem("token"));

  if (!autenticado) return <Login />;

  return <Dashboard onSalir={() => setAutenticado(false)} />;
}

export default App;




// import { useState } from "react";
// import Login from "./paginas/Login";
// import Dashboard from "./paginas/Dashboard";

// function App() {
//   const [autenticado, setAutenticado] = useState(!!localStorage.getItem("token"));

//   if (!autenticado) return <Login />;

//   return <Dashboard onSalir={() => setAutenticado(false)} />;
// }

// export default App;

