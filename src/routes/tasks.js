import express from 'express'
import db from '../database.js'

const router = express.Router();

router.get('/', (req, res) => {
    db.all('SELECT * FROM tasks', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(rows)
    })
})

router.get('/:id', (req, res) => {
    db.get(`SELECT * FROM tasks WHERE id = ${req.params.id}`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(rows)
    })
})

router.post('/', (req, res) => {
    const { name, value } = req.body
    db.run('INSERT INTO tasks (name, value) VALUES (?, ?)',
        [name, value], (err) => {
            if (err) {
                res.status(500).json({ error: err.message })
                return
            }
            res.json({ name, value })
        })
})

router.patch('/:id', (req, res) => {
    const { name, value } = req.body
    db.run('UPDATE tasks SET name = ?, value = ?, WHERE id = ?',
        [name, value, req.params.id], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message })
                return
            }
            res.json({ name, value })
        }
    )
})

router.delete('/:id', (req, res) => {
    db.run('DELETE FROM tasks WHERE id = ?',
        [req.params.id], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message })
                return
            }
            res.json(rows)
        })
})

export default router