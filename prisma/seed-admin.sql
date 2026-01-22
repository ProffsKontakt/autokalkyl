-- Create Super Admin User for Kalkyla.se
-- Run this in Neon Console SQL Editor after schema.sql

-- Super Admin (no orgId - has access to all organizations)
INSERT INTO "User" (
    "id",
    "email",
    "passwordHash",
    "name",
    "role",
    "orgId",
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    'clsuperadmin001',
    'admin@kalkyla.se',
    '$2b$10$Ii3Pibbz8GMNwTN2QTsgl.rlLm06ZuOgnjTeehVLb94r4FfCxZ4Du',
    'Super Admin',
    'SUPER_ADMIN',
    NULL,
    true,
    NOW(),
    NOW()
);

-- Login credentials:
-- Email: admin@kalkyla.se
-- Password: admin123
--
-- IMPORTANT: Change this password after first login!
