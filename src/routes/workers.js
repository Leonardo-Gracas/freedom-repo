import express from 'express'
import db from '../database.js'

const router = express.Router();

router.get('/', (req, res) => {
    db.all('SELECT * FROM workers', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(rows)
    })
})

router.get('/:id', (req, res) => {
    db.get(`SELECT * FROM workers WHERE id = ${req.params.id}`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(rows)
    })
})

router.post('/', (req, res) => {
    const { name, contact, address } = req.body
    db.run('INSERT INTO workers (name, contact, address) VALUES (?, ?, ?)',
        [name, contact, address], (err) => {
            if (err) {
                res.status(500).json({ error: err.message })
                return
            }
            res.json({ name, contact, address })
        })
})

router.patch('/:id', (req, res) => {
    const { name, contact, address } = req.body
    db.run('UPDATE workers SET name = ?, contact = ?, address = ? WHERE id = ?',
        [name, contact, address, req.params.id], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message })
                return
            }
            res.json({ name, contact, address })
        }
    )
})

router.delete('/:id', (req, res) => {
    db.run('DELETE FROM workers WHERE id = ?',
        [req.params.id], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message })
                return
            }
            res.json(rows)
        })
})

export default router