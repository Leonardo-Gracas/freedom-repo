import sqlite3 from 'sqlite3'
import path from 'path'

//const dbPath = path.resolve(__dirname, 'db.sqlite')
const dbPath = './src/db.sqlite'


const db = new sqlite3.Database(dbPath, (err) => {
    if(err){
        console.error('Erro ao conectar o banco de dados:', err.message)
    } else{
        console.log('Conectado ao banco de dados SQlite')
    }
})

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact TEXT NOT NULL UNIQUE,
        adderess TEXT NOT NULL UNIQUE
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar a tabela:', err.message);
        } else {
            console.log('Tabela `clients` verificada/criada com sucesso.');
        }
    });
});

export default db