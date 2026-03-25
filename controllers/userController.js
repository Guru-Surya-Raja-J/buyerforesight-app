import db from '../database.js';

// GET /users with optional search and sort
export const getUsers = (req, res) => {
    const { search, sort, order } = req.query;
    
    let query = 'SELECT * FROM users';
    const params = [];

    // Make sure search conditions are applied if search is provided
    if (search) {
        query += ' WHERE name LIKE ? OR email LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
    }

    // Handline optional sorting
    if (sort) {
        // Prevent SQL injection by strictly matching allowed columns
        const allowedSortColumns = ['id', 'name', 'email', 'created_at'];
        const sortColumn = allowedSortColumns.includes(sort) ? sort : 'id';
        
        const sortOrder = (order && order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
        
        query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve users' });
        }
        res.json({ data: rows });
    });
};

// GET /users/:id
export const getUserById = (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ data: row });
    });
};

// POST /users
export const createUser = (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
    db.run(query, [name, email], function(err) {
        if (err) {
            // Handle unique constraint error for email
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: 'Failed to create user' });
        }
        
        res.status(201).json({
            data: { id: this.lastID, name, email }
        });
    });
};

// PUT /users/:id
export const updateUser = (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name && !email) {
        return res.status(400).json({ error: 'Provide at least one field to update (name or email)' });
    }

    // Build query dynamically based on provided fields
    const updates = [];
    const params = [];

    if (name) {
        updates.push('name = ?');
        params.push(name);
    }
    if (email) {
        updates.push('email = ?');
        params.push(email);
    }

    params.push(id); // for the WHERE clause

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Email already in use' });
            }
            return res.status(500).json({ error: 'Failed to update user' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated successfully' });
    });
};

// DELETE /users/:id
export const deleteUser = (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete user' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        db.get('SELECT COUNT(*) as count FROM users', (countErr, row) => {
            if (!countErr && row && row.count === 0) {
                db.run("DELETE FROM sqlite_sequence WHERE name='users'");
            }
            res.json({ message: 'User deleted successfully' });
        });
    });
};
