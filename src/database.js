import sqlite3 from 'sqlite3';

const dbPath = './src/db.sqlite';

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite');
    }
});

// Habilitar suporte a FOREIGN KEY no SQLite
db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) {
        console.error('Erro ao habilitar foreign_keys:', err.message);
    } else {
        console.log('Suporte a foreign_keys habilitado.');
    }
});

// Criar tabela de clientes
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar a tabela clients:', err.message);
        } else {
            console.log('Tabela `clients` verificada/criada com sucesso.');
        }
    });
});

// Criar tabela de trabalhadores
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS workers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar a tabela workers:', err.message);
        } else {
            console.log('Tabela `workers` verificada/criada com sucesso.');
        }
    });
});

// Criar tabela de tarefas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        value REAL NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar a tabela tasks:', err.message);
        } else {
            console.log('Tabela `tasks` verificada/criada com sucesso.');
        }
    });
});

// Criar tabela de ordens de serviço
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL, -- Relacionamento com tabela clients
        create_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Data de criação
        date DATETIME NOT NULL, -- Data da ordem
        total_value REAL NOT NULL, -- Valor total da ordem
        status TEXT NOT NULL, -- Status da ordem
        obs TEXT, -- Observações
        FOREIGN KEY (client_id) REFERENCES clients (id) -- Vincula com clientes
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar a tabela orders:', err.message);
        } else {
            console.log('Tabela `orders` verificada/criada com sucesso.');
        }
    });
});

// Tabela intermediária para relação muitos-para-muitos entre orders e tasks
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS order_tasks (
        order_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        PRIMARY KEY (order_id, task_id),
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (task_id) REFERENCES tasks (id)
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar a tabela order_tasks:', err.message);
        } else {
            console.log('Tabela `order_tasks` verificada/criada com sucesso.');
        }
    });
});

// Tabela intermediária para relação muitos-para-muitos entre orders e workers
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS order_workers (
        order_id INTEGER NOT NULL,
        worker_id INTEGER NOT NULL,
        PRIMARY KEY (order_id, worker_id),
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (worker_id) REFERENCES workers (id)
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar a tabela order_workers:', err.message);
        } else {
            console.log('Tabela `order_workers` verificada/criada com sucesso.');
        }
    });
});

export default db;