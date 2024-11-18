import express from "express"

import clientRoutes from './src/routes/clients.js'
import workerRoutes from './src/routes/workers.js'
import orderRoutes from './src/routes/orders.js'
import taskRoutes from './src/routes/tasks.js'

const app = express()

app.use(express.json())

app.use('/clients', clientRoutes)
app.use('/workers', workerRoutes)
app.use('/orders', orderRoutes)
app.use('/tasks', taskRoutes)

// Iniciar o servidor
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})