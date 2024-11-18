import express from 'express'
import db from '../database.js'

const router = express.Router();

router.get('/', (req, res) => {
    const sql = `
        SELECT 
            o.id AS order_id,
            o.create_date,
            o.date,
            o.total_value,
            o.status,
            o.obs,
            JSON_OBJECT(
                'id', c.id,
                'name', c.name,
                'contact', c.contact,
                'address', c.address
            ) AS client,
            JSON_GROUP_ARRAY(
                JSON_OBJECT(
                    'id', t.id,
                    'name', t.name,
                    'value', t.value
                )
            ) AS tasks,
            JSON_GROUP_ARRAY(
                JSON_OBJECT(
                    'id', w.id,
                    'name', w.name,
                    'contact', w.contact,
                    'address', w.address
                )
            ) AS workers
        FROM 
            orders o
        LEFT JOIN 
            clients c ON o.client_id = c.id
        LEFT JOIN 
            order_tasks ot ON o.id = ot.order_id
        LEFT JOIN 
            tasks t ON ot.task_id = t.id
        LEFT JOIN 
            order_workers ow ON o.id = ow.order_id
        LEFT JOIN 
            workers w ON ow.worker_id = w.id
        GROUP BY 
            o.id;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Parseia os objetos JSON gerados no SQLite
        const orders = rows.map(row => ({
            id: row.order_id,
            create_date: row.create_date,
            date: row.date,
            total_value: row.total_value,
            status: row.status,
            obs: row.obs,
            client: JSON.parse(row.client),
            tasks: JSON.parse(row.tasks),
            workers: JSON.parse(row.workers)
        }));

        res.json(orders);
    });
});


router.get('/:id', (req, res) => {
    const orderId = req.params.id;

    const sql = `
        SELECT 
            o.id AS order_id,
            o.create_date,
            o.date,
            o.total_value,
            o.status,
            o.obs,
            JSON_OBJECT(
                'id', c.id,
                'name', c.name,
                'contact', c.contact,
                'address', c.address
            ) AS client,
            JSON_GROUP_ARRAY(
                JSON_OBJECT(
                    'id', t.id,
                    'name', t.name,
                    'value', t.value
                )
            ) AS tasks,
            JSON_GROUP_ARRAY(
                JSON_OBJECT(
                    'id', w.id,
                    'name', w.name,
                    'contact', w.contact,
                    'address', w.address
                )
            ) AS workers
        FROM 
            orders o
        LEFT JOIN 
            clients c ON o.client_id = c.id
        LEFT JOIN 
            order_tasks ot ON o.id = ot.order_id
        LEFT JOIN 
            tasks t ON ot.task_id = t.id
        LEFT JOIN 
            order_workers ow ON o.id = ow.order_id
        LEFT JOIN 
            workers w ON ow.worker_id = w.id
        WHERE 
            o.id = ?
        GROUP BY 
            o.id;
    `;

    db.get(sql, [orderId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (!row) {
            res.status(404).json({ error: 'Pedido não encontrado.' });
            return;
        }

        // Como o SQLite já retorna os dados formatados como JSON, basta enviá-los.
        res.json({
            id: row.order_id,
            create_date: row.create_date,
            date: row.date,
            total_value: row.total_value,
            status: row.status,
            obs: row.obs,
            client: JSON.parse(row.client),
            tasks: JSON.parse(row.tasks),
            workers: JSON.parse(row.workers)
        });
    });
});

router.post('/', (req, res) => {
    const { client_id, create_date, date, total_value, status, obs, tasks, workers } = req.body;

    if (!client_id || !create_date || !date || !total_value || !tasks || !workers) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes!' });
    }

    const insertOrderSQL = `
        INSERT INTO orders (client_id, create_date, date, total_value, status, obs)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(insertOrderSQL, [client_id, create_date, date, total_value, status, obs], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const orderId = this.lastID; // ID da ordem recém-criada

        // Insere relacionamentos com tarefas
        const insertTasksSQL = `
            INSERT INTO order_tasks (order_id, task_id) 
            VALUES (?, ?)
        `;
        const tasksInsertPromises = tasks.map(taskId =>
            new Promise((resolve, reject) => {
                db.run(insertTasksSQL, [orderId, taskId], err => {
                    if (err) reject(err);
                    else resolve();
                });
            })
        );

        // Insere relacionamentos com trabalhadores
        const insertWorkersSQL = `
            INSERT INTO order_workers (order_id, worker_id) 
            VALUES (?, ?)
        `;
        const workersInsertPromises = workers.map(workerId =>
            new Promise((resolve, reject) => {
                db.run(insertWorkersSQL, [orderId, workerId], err => {
                    if (err) reject(err);
                    else resolve();
                });
            })
        );

        // Aguarda inserção de todas as tarefas e trabalhadores
        Promise.all([...tasksInsertPromises, ...workersInsertPromises])
            .then(() => {
                res.status(201).json({
                    id: orderId,
                    client_id,
                    create_date,
                    date,
                    total_value,
                    status,
                    obs,
                    tasks,
                    workers
                });
            })
            .catch(insertErr => {
                res.status(500).json({ error: insertErr.message });
            });
    });
});

router.patch('/:id', (req, res) => {
    const { client_id, create_date, date, total_value, status, obs, tasks, workers } = req.body;
    const orderId = req.params.id;

    // Verifica se o pedido existe
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        // Atualiza a tabela orders
        const updateOrderSQL = `
            UPDATE orders
            SET client_id = ?, create_date = ?, date = ?, total_value = ?, status = ?, obs = ?
            WHERE id = ?
        `;

        db.run(updateOrderSQL, [client_id || order.client_id, create_date || order.create_date, date || order.date, total_value || order.total_value, status || order.status, obs || order.obs, orderId], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Atualiza as tarefas associadas, se fornecidas
            const updateTasks = () => {
                if (!tasks) return Promise.resolve(); // Se não há tarefas, pula essa etapa.

                const deleteOldTasksSQL = `DELETE FROM order_tasks WHERE order_id = ?`;
                const insertTaskSQL = `INSERT INTO order_tasks (order_id, task_id) VALUES (?, ?)`;

                return new Promise((resolve, reject) => {
                    db.run(deleteOldTasksSQL, [orderId], (err) => {
                        if (err) return reject(err);

                        const taskPromises = tasks.map(taskId => {
                            return new Promise((resolveTask, rejectTask) => {
                                db.run(insertTaskSQL, [orderId, taskId], (err) => {
                                    if (err) rejectTask(err);
                                    else resolveTask();
                                });
                            });
                        });

                        Promise.all(taskPromises).then(resolve).catch(reject);
                    });
                });
            };

            // Atualiza os trabalhadores associados, se fornecidos
            const updateWorkers = () => {
                if (!workers) return Promise.resolve(); // Se não há trabalhadores, pula essa etapa.

                const deleteOldWorkersSQL = `DELETE FROM order_workers WHERE order_id = ?`;
                const insertWorkerSQL = `INSERT INTO order_workers (order_id, worker_id) VALUES (?, ?)`;

                return new Promise((resolve, reject) => {
                    db.run(deleteOldWorkersSQL, [orderId], (err) => {
                        if (err) return reject(err);

                        const workerPromises = workers.map(workerId => {
                            return new Promise((resolveWorker, rejectWorker) => {
                                db.run(insertWorkerSQL, [orderId, workerId], (err) => {
                                    if (err) rejectWorker(err);
                                    else resolveWorker();
                                });
                            });
                        });

                        Promise.all(workerPromises).then(resolve).catch(reject);
                    });
                });
            };

            // Atualiza tarefas e trabalhadores em paralelo
            Promise.all([updateTasks(), updateWorkers()])
                .then(() => {
                    res.json({
                        id: orderId,
                        client_id: client_id || order.client_id,
                        create_date: create_date || order.create_date,
                        date: date || order.date,
                        total_value: total_value || order.total_value,
                        status: status || order.status,
                        obs: obs || order.obs,
                        tasks: tasks || 'Não atualizado',
                        workers: workers || 'Não atualizado'
                    });
                })
                .catch(updateErr => {
                    res.status(500).json({ error: updateErr.message });
                });
        });
    });
});

router.delete('/:id', (req, res) => {
    const orderId = req.params.id;

    // Verifica se o pedido existe
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!order) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        // Inicia a exclusão em cascata
        const deleteTasksSQL = `DELETE FROM order_tasks WHERE order_id = ?`;
        const deleteWorkersSQL = `DELETE FROM order_workers WHERE order_id = ?`;
        const deleteOrderSQL = `DELETE FROM orders WHERE id = ?`;

        db.run(deleteTasksSQL, [orderId], (err) => {
            if (err) {
                return res.status(500).json({ error: `Erro ao remover tarefas: ${err.message}` });
            }

            db.run(deleteWorkersSQL, [orderId], (err) => {
                if (err) {
                    return res.status(500).json({ error: `Erro ao remover trabalhadores: ${err.message}` });
                }

                db.run(deleteOrderSQL, [orderId], (err) => {
                    if (err) {
                        return res.status(500).json({ error: `Erro ao remover ordem: ${err.message}` });
                    }

                    res.json({ message: `Ordem ${orderId} e seus relacionamentos foram removidos com sucesso.` });
                });
            });
        });
    });
});

export default router