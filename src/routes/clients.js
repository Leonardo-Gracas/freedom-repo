import express from 'express'
import db from '../database.js'

const router = express.Router();

router.get('/', (req, res) => {
    db.all('SELECT * FROM clients', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(rows)
    })
})

router.post('/', (req, res) => {
    const { name, contact, adderess } = req.body
    db.run('INSERT INTO clients (name, contact, adderess) VALUES (?, ?, ?)',
        [name, contact, adderess], (err) => {
            if (err) {
                res.status(500).json({ error: err.message })
                return
            }
            res.json({ name, contact, adderess })
        })
})

// echo "# Freedom-Sec" >> README.md
// git init
// git add README.md
// git commit -m "first commit"
// git branch -M main
// git remote add origin https://github.com/Leonardo-Gracas/Freedom-Sec.git
// git push -u origin main

export default router