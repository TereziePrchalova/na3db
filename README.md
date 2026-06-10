# na3db

A web application for querying and browsing nucleic acid structures from the NDB/PDB database.

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (v18+) and npm
- Python 3 with `pip` (for loading CIF data)

## Setup

### 1. Build and start the database

```bash
make build
make up
```

This builds the containers and starts a PostgreSQL instance on port `5432`. On first run it applies `init.sql` to create the schema.

### 2. Load CIF data

Install the Python dependencies and load your CIF files:

```bash
cd scripts
python -m venv .venv
.venv/bin/pip install gemmi psycopg2-binary
cd ..

make db-load CIF_DIR=/path/to/cif/files
```

Add `--atoms` if you also want to load atom-level data (slow):

```bash
scripts/.venv/bin/python scripts/load_cif.py /path/to/cif/files --atoms
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=na3db
```

### 4. Install dependencies and run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Production (Docker)

To run the full stack (app + database) in Docker:

```bash
make build
make up
```

The app is served at `http://localhost:3000`.

To stop:

```bash
make down
```

## Other useful commands

| Command | Description |
|---|---|
| `make logs` | Stream container logs |
| `make restart` | Restart all containers |
| `make reset-db` | Wipe and recreate the database (destructive) |
| `make clean` | Remove all containers, volumes, and images |
