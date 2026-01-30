require("dotenv").config();
const app = require("./src/app");

const puerto = process.env.PUERTO_SERVIDOR || 3000;

app.listen(puerto, () => {
  console.log(`✅ Servidor corriendo en: http://localhost:${puerto}`);
});
