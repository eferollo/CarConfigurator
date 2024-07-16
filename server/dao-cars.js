"use strict"

const db = require('./db');

const convertDbRecord = (dbRecord) => {
    return Object.assign({}, dbRecord);
}

/* Helper function for inserting or updating accessories for a configuration */
async function updateAccessories(configurationId, newAccessories) {
    try {
        /* Update: delete all accessories for a given configuration id that are not present in the new accessories list
        *  Create: does not find anything during creation so the deletion will not affect the database */
        const deleteSql = 'DELETE FROM configuration_accessories WHERE configurationId = ? AND accessoryId NOT IN (?)';
        const accessoryIds = newAccessories || [];

        await new Promise((resolve, reject) => {
            db.run(deleteSql, [configurationId, accessoryIds], function (err) {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });

        /* Insert all the new accessories in the database */
        const insertSql = 'INSERT INTO configuration_accessories (configurationId, accessoryId) VALUES (?, ?)';
        const insertPromises = accessoryIds.map(accessoryId => {
            return new Promise((resolve, reject) => {
                db.run(insertSql, [configurationId, accessoryId], function (err) {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        });

        await Promise.all(insertPromises);
    } catch (err) {
        throw new Error(`Error updating accessories: ${err.message}`);
    }
}

/* Helper function for retrieving the accessories constraints */
function getAccessoryConstraints() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM accessory_constraints';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            const accessoryConstraints = rows.map(convertDbRecord);
            resolve(accessoryConstraints);
        });
    });
}

/* Helper function for validating the received accessories with their constraints */
async function validateAccessories(carModelId, accessories, accessoryConstraints) {
    try {
        /* First retrieve the maximum number of accessories given a car model id */
        const sql = 'SELECT maxAccessories FROM car_models WHERE id = ?';
        const maxAccessories = await new Promise((resolve, reject) => {
            db.get(sql, [carModelId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row.maxAccessories);
            });
        });

        /* Validate the length of accessories array against the maximum allowed */
        if (accessories.length > maxAccessories) {
            throw new Error(`Exceeded maximum accessories allowed`);
        }

        /* Validate the requested accessories with the accessory constraints */
        for (const accessoryId of accessories) {
            const constraint = accessoryConstraints.find(e => e.accessoryId === accessoryId);

            if (constraint) {
                if (constraint.requiredAccessoryId && !accessories.includes(constraint.requiredAccessoryId)) {
                    throw new Error(`The accessories do not satisfy the constraints`);
                }
                if (constraint.incompatibleAccessoryId && accessories.includes(constraint.incompatibleAccessoryId)) {
                    throw new Error(`The accessories do not satisfy the constraints`);
                }
            }
        }
    } catch (error) {
        throw error;
    }
}

/* Helper function for updating accessories availability */
async function updateAccessoryAvailability(accessories, value) {
    const sql = 'UPDATE accessories SET availability = availability + ? WHERE id = ?';

    try {
        for (let accessory of accessories) {
            await new Promise((resolve, reject) => {
                db.run(sql, [value, accessory], function (err) {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            });
        }
    } catch (err) {
        throw err;
    }
}

/* Helper function for retrieving the current accessories of the user configuration */
async function getCurrentAccessories(configurationId) {
    const sql = 'SELECT accessoryId FROM configuration_accessories WHERE configurationId = ?';
    return new Promise((resolve, reject) => {
        db.all(sql, [configurationId], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows.map(row => row.accessoryId));
        });
    });
}

/* Retrieve a car configuration by user id */
exports.getCarConfigByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        /* Retrieve first all the configuration accessories from the configuration_accessories table.
         * Select the columns and concatenate the accessory IDs associated with each configuration. Do a left join
         * between configurations table and configuration accessories (based on the matching config id) then filter
         * only those configurations where the userId matches the provided userId and group by configuration id. */
        const sql = `SELECT c.*, GROUP_CONCAT(ca.accessoryId, ',') as accessoryIds FROM configurations c
                    LEFT JOIN main.configuration_accessories ca on c.id = ca.configurationId 
                    WHERE c.userId = ? GROUP BY c.id`;
        db.get(sql, [userId], (err, row) => {
            if (err) {
                reject(err);
            }

            if (row) {
                const config = convertDbRecord(row);
                config.accessoryIds = row.accessoryIds ? row.accessoryIds.split(',').map(Number) : [];
                resolve(convertDbRecord(config));
            } else {
                resolve(null);
            }
        });
    });
};

/* Save a new car configuration */
exports.createCarConfig = async (carConfig) => {
    try {
        /* Check if the user has already a configuration. If yes then fail */
        const check = 'SELECT * FROM configurations WHERE userId = ?';
        const row = await new Promise((resolve, reject) => {
            db.get(check, [carConfig.userId], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
        if (row) {
            throw new Error("User has already a configuration");
        }

        /* Check for repeated accessory ids */
        const accessoriesSet = new Set(carConfig.accessories);
        if (accessoriesSet.size !== carConfig.accessories.length) {
            throw new Error('Configuration not valid');
        }

        /* Get constraints and validate accessories against the constraints */
        const accessoryConstraints = await getAccessoryConstraints();
        await validateAccessories(carConfig.carModelId, carConfig.accessories, accessoryConstraints);

        /* Insert a new entry in the configuration table for a given user id */
        const insert = 'INSERT INTO configurations (userId, carModelId) VALUES (?, ?)';
        const configurationId = await new Promise((resolve, reject) => {
            db.run(insert, [carConfig.userId, carConfig.carModelId], function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.lastID);
            });
        });

        await updateAccessoryAvailability(carConfig.accessories, -1);
        await updateAccessories(configurationId, carConfig.accessories);

        /* Update the flag hasCarConfiguration in the user table */
        const updateUserSql = 'UPDATE users SET hasCarConfiguration = ? WHERE id = ?';
        await new Promise((resolve, reject) => {
            db.run(updateUserSql, [true, carConfig.userId], (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });

        return { status: 'Car configuration saved successfully' };
    } catch (err) {
        throw err;
    }
};

/* Update a car configuration */
exports.updateCarConfig = (carConfig) => {
    return new Promise(async (resolve, reject) => {
        try {
            /* Check for repeated accessory ids */
            const accessoriesSet = new Set(carConfig.accessories);
            if (accessoriesSet.size !== carConfig.accessories.length) {
                return reject(new Error('Configuration not valid'));
            }

            /* Get constraints and validate accessories against the constraints */
            const accessoryConstraints = await getAccessoryConstraints();
            await validateAccessories(carConfig.carModelId, carConfig.accessories, accessoryConstraints);

            /* Check if the configuration for a given user id exists */
            const check = 'SELECT * FROM configurations WHERE userId = ?';
            db.get(check, [carConfig.userId], async (err, row) => {
                if (err) {
                    return reject(err);
                }

                if (row) {
                    const configurationId = row.id;
                    const currentAccessories = await getCurrentAccessories(configurationId);
                    const newAccessories = carConfig.accessories.filter(id => !currentAccessories.includes(id));
                    const removedAccessories = currentAccessories.filter(id => !carConfig.accessories.includes(id));

                    try {
                        await updateAccessoryAvailability(newAccessories, -1);
                        await updateAccessoryAvailability(removedAccessories, 1);
                        const update = 'UPDATE configurations SET carModelId = ? WHERE userId = ?';
                        db.run(update, [carConfig.carModelId, carConfig.userId], async function (err) {
                            if (err) {
                                return reject(err);
                            }
                            try {
                                await updateAccessories(configurationId, carConfig.accessories);
                                resolve({ status: 'Car configuration updated successfully' });
                            } catch (err) {
                                reject(err);
                            }
                        });
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    return reject(new Error('Configuration not found'));
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

/* Delete a car configuration by user id */
exports.deleteCarConfig = (userId) => {
    return new Promise((resolve, reject) => {
        /* Retrieve the configuration ID associated with the user ID */
        const configIdSql = 'SELECT id FROM configurations WHERE userId = ?';
        db.get(configIdSql, [userId], async (err, row) => {
            if (err) {
                reject(err);
            }

            /* If no configuration found resolve immediately */
            if (!row) {
                resolve(row);
            } else {
                const configId = row.id;
                const currentAccessories = await getCurrentAccessories(configId);

                try {
                    await updateAccessoryAvailability(currentAccessories, 1);
                    /* Delete accessories associate with the configuration ID */
                    const deleteAccessoriesSql = 'DELETE FROM configuration_accessories WHERE configurationId = ?';
                    db.run(deleteAccessoriesSql, [configId], function (err) {
                        if (err) {
                            reject(err);
                        }

                        /* Update user configuration status to false */
                        const updateUser = 'UPDATE users SET hasCarConfiguration = ? WHERE id = ?'
                        db.run(updateUser, [false, userId], function (err) {
                            if (err) {
                                reject(err);
                            }

                            /* Delete the user configuration */
                            const deleteConfigSql = 'DELETE FROM configurations WHERE userId = ?';
                            db.run(deleteConfigSql, [userId], function (err) {
                                if (err) {
                                    reject(err);
                                }
                                resolve(this.changes);
                            });
                        });
                    });
                } catch {
                    reject(err);
                }
            }
        });
    });
};

/* Retrieve the list of the car models */
exports.listCarModels = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM car_models';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            const carModels = rows.map(convertDbRecord);
            resolve(carModels);
        });
    });
};

/* Retrieve the list of all accessories */
exports.listAccessories = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT a.*, ac.requiredAccessoryId, ac.incompatibleAccessoryId
                     FROM accessories a
                     LEFT JOIN accessory_constraints ac ON a.id = ac.accessoryId`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            const accessories = rows.map(row => ({
                id: row.id,
                name: row.name,
                price: row.price,
                availability: row.availability,
                requiredAccessoryId: row.requiredAccessoryId,
                incompatibleAccessoryId: row.incompatibleAccessoryId
            }));
            resolve(accessories);
        });
    });
};
