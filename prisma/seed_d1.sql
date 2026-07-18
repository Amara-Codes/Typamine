-- Insert Roles if not exist
INSERT INTO "Role" ("id", "name", "createdAt", "updatedAt") 
VALUES ('cfb7c1a8-7fcd-40a2-9e2c-3a8309a0662d', 'ADMIN', STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'), STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT("name") DO UPDATE SET "updatedAt" = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now');

INSERT INTO "Role" ("id", "name", "createdAt", "updatedAt") 
VALUES ('a0f0ce17-ce6a-4d33-91cf-ea09bb53e7f9', 'USER', STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'), STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT("name") DO UPDATE SET "updatedAt" = STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now');

-- Insert Admin User if not exist
INSERT INTO "User" ("id", "name", "email", "password", "createdAt", "updatedAt") 
VALUES ('5e8fb85c-4b53-48e0-82a1-fa36fa78ea8d', 'Admin', 'admin@typamine.com', '$2b$10$Pkhm1dNy1e3BfskSqMvz9uPvmA7pEcIBxkdguzugy0QAsYhSVughG', STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'), STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT("email") DO NOTHING;

-- Map Admin User to Admin Role
INSERT INTO "_UserRoles" ("A", "B") VALUES ('cfb7c1a8-7fcd-40a2-9e2c-3a8309a0662d', '5e8fb85c-4b53-48e0-82a1-fa36fa78ea8d')
ON CONFLICT("A", "B") DO NOTHING;
