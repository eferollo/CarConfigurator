BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT,
    "hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "isGoodClient" BOOLEAN NOT NULL DEFAULT 0,
    "hasCarConfiguration" BOOLEAN NOT NULL DEFAULT 0,
    PRIMARY KEY ("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "car_models" (
    "id" INTEGER,
    "model" TEXT NOT NULL,
    "enginePower" INTEGER NOT NULL CHECK("enginePower" IN (50, 100, 150)),
    "cost" INTEGER NOT NULL,
    "maxAccessories" INTEGER NOT NULL,
    PRIMARY KEY ("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "accessories" (
    "id" INTEGER,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "availability" INTEGER NOT NULL,
    PRIMARY KEY ("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS "accessory_constraints" (
    "accessoryId" INTEGER NOT NULL,
    "requiredAccessoryId" INTEGER,
    "incompatibleAccessoryId" INTEGER,
    PRIMARY KEY ("accessoryId"),
    FOREIGN KEY("accessoryId") REFERENCES accessories(id),
    FOREIGN KEY("requiredAccessoryId") REFERENCES accessories(id),
    FOREIGN KEY("incompatibleAccessoryId") REFERENCES accessories(id)
);

CREATE TABLE IF NOT EXISTS "configurations" (
    "id" INTEGER,
    "userId" INTEGER NOT NULL,
    "carModelId" INTEGER NOT NULL,
    PRIMARY KEY ("id" AUTOINCREMENT),
    FOREIGN KEY ("userId") REFERENCES users("id"),
    FOREIGN KEY ("carModelId") REFERENCES car_models("id")
);

CREATE TABLE IF NOT EXISTS "configuration_accessories" (
    "id" INTEGER,
    "configurationId" INTEGER NOT NULL,
    "accessoryId" INTEGER,
    PRIMARY KEY ("id" AUTOINCREMENT),
    FOREIGN KEY("configurationId") REFERENCES configurations(id),
    FOREIGN KEY("accessoryId") REFERENCES accessories(id)
);

-- Users
INSERT INTO "users" ("email", "name", "hash", "salt", "isGoodClient", "hasCarConfiguration") VALUES ('user1@gmail.com', 'Enrico', '78504b005e5b3aaaa4722fadca1cebb4cc1630d2eb52588a5a4de3d64fe655e6', 'ef1e62deda2f0eed', 1, 1);
INSERT INTO "users" ("email", "name", "hash", "salt", "isGoodClient", "hasCarConfiguration") VALUES ('user2@gmail.com', 'Antonio', '943c5de6d98e627cc6a20317c04c5cfc3bc8454396cdc1d68609bdd5f948ac30', '7f6ba4684b25f09b', 0, 1);
INSERT INTO "users" ("email", "name", "hash", "salt", "isGoodClient", "hasCarConfiguration") VALUES ('user3@gmail.com', 'Francesco', 'd12f90da2d3a8c8f9e86c2633472750dcee6ca91f651ac1eccc805be0fa842bf', 'a60eecd9c8487808', 0, 1);
INSERT INTO "users" ("email", "name", "hash", "salt", "isGoodClient", "hasCarConfiguration") VALUES ('user4@gmail.com', 'Giorgio', '0475e1b07b4245dd944ebceb14cc8d605cd0f7218574dc29e73a5e4e5b12673f', 'f2fbf260551b75a8', 0, 0);
INSERT INTO "users" ("email", "name", "hash", "salt", "isGoodClient", "hasCarConfiguration") VALUES ('user5@gmail.com', 'Aurora', '5341715ddbe8b5cc505ace709879a07f15064688975d58b0ae9339f9c6e9411d', 'bf76d071ddfbed04', 1, 0);

-- Car models
INSERT INTO "car_models" ("model", "enginePower", "cost", "maxAccessories") VALUES ('Volkswagen Polo', 50, 10000, 4);
INSERT INTO "car_models" ("model", "enginePower", "cost", "maxAccessories") VALUES ('Volkswagen Golf', 100, 12000, 5);
INSERT INTO "car_models" ("model", "enginePower", "cost", "maxAccessories") VALUES ('Volkswagen T-Roc', 150, 14000, 7);

-- Accessories Table
INSERT INTO "accessories" ("name", "price", "availability") VALUES ('Radio', 300, 10);
INSERT INTO "accessories" ("name", "price", "availability") VALUES ('Satellite navigator', 600, 10);
INSERT INTO "accessories" ("name", "price", "availability") VALUES ('Bluetooth', 200, 10);
INSERT INTO "accessories" ("name", "price", "availability") VALUES ('Power windows', 200, 10);
INSERT INTO "accessories" ("name", "price", "availability") VALUES ('Extra front lights', 150, 10);
INSERT INTO "accessories" ("name", "price", "availability") VALUES ('Extra rear lights', 150, 10);
INSERT INTO "accessories" ("name", "price", "availability") VALUES ('Air conditioning', 600, 1);
INSERT INTO "accessories" ("name", "price", "availability") VALUES ('Spare tire', 200, 10);
INSERT INTO "accessories" ("name", "price", "availability") VALUES ('Assisted driving', 1200, 2);
INSERT INTO "accessories" ("name", "price", "availability") VALUES ('Automatic braking', 800, 2);

-- Accessory constraints table
INSERT INTO "accessory_constraints" ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (1, NULL, NULL);
INSERT INTO "accessory_constraints" ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (2, 3, NULL); -- Satellite navigator requires bluetooth
INSERT INTO "accessory_constraints" ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (3, 1, NULL); -- Bluetooth requires radio
INSERT INTO "accessory_constraints" ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (4, NULL, NULL);
INSERT INTO "accessory_constraints" ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (5, NULL, NULL);
INSERT INTO "accessory_constraints" ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (6, 5, NULL); -- Extra rear lights require extra front lights
INSERT INTO "accessory_constraints" ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (7, 4, 8); -- Air conditioning requires power windows, incompatible with spare tire
INSERT INTO "accessory_constraints" ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (8, NULL, 7); -- Spare tire incompatible with air conditioning
INSERT INTO "accessory_constraints" ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (9, NULL, 10); -- Assisted driving incompatible with automatic braking
INSERT INTO "accessory_constraints" ("accessoryId", "requiredAccessoryId", "incompatibleAccessoryId") VALUES (10, NULL, 9); -- Automatic braking incompatible with assisted driving

-- Initial configurations
INSERT INTO "configurations" ("userId", "carModelId") VALUES (1, 3); -- User 1, 150 KW
INSERT INTO "configurations" ("userId", "carModelId") VALUES (2, 2); -- User 2, 100 KW
INSERT INTO "configurations" ("userId", "carModelId") VALUES (3, 1); -- User 3, 50 KW

-- Configuration accessories table
-- Configuration 1 (user 1), automatic braking, extra front/rear lights, radio, bluetooth, air conditioning
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (1, 10);
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (1, 5);
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (1, 6);
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (1, 1);
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (1, 3);
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (1, 7);
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (1, 4);
-- Configuration 2 (user 2), radio, bluetooth, satellite navigation, air conditioning
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (2, 1);
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (2, 3);
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (2, 2);
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (2, 7);
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (2, 4);
-- Configuration 3 (user 3), no accessories
INSERT INTO "configuration_accessories" ("configurationId", "accessoryID") VALUES (3, NULL);

COMMIT;
