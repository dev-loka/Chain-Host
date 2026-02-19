-- ============================================================
-- Chain Host — PostgreSQL Init Script
-- Creates additional databases for services
-- ============================================================

-- Database for Forgejo
SELECT 'CREATE DATABASE forgejo' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'forgejo')\gexec

-- Database for n8n
SELECT 'CREATE DATABASE n8n' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n')\gexec

-- Database for Roundcube
SELECT 'CREATE DATABASE roundcube' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'roundcube')\gexec

-- Extensions for main database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
