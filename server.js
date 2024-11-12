import express from "express"
const app = express();
import clientRoutes from './src/routes/clients.js'

app.use(express.json());

app.use('/clients', clientRoutes);

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});