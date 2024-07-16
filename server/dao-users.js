"use strict";

const db = require('./db');
const crypto = require('crypto');

exports.getUserById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE id = ?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            }
            if (row === undefined) {
                resolve({ error: "User not found!" });
            } else {
                const user = { id: row.id, email: row.email, name: row.name };
                resolve(user);
            }
        });
    });
};

exports.getUser = (email, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE email = ?';
        db.get(sql, [email], (err, row) => {
            if (err) {
                reject(err);
            } else if (row === undefined) {
                resolve(false);
            } else {
                const user = {
                    id: row.id,
                    email: row.email,
                    name: row.name,
                    isGoodClient: row.isGoodClient,
                    hasCarConfiguration: row.hasCarConfiguration
                };
                crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
                    if (err) {
                        reject(err);
                    }
                    if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword)) {
                        resolve(false);
                    } else {
                        resolve(user);
                    }
                });
            }
        });
    })
};
