# Control Plane Development Environment

This directory contains the development setup for the Control Plane service.

## Quick Start

```bash
# Start the development environment
./start.sh

# In another terminal, start the Control Plane service
cd ../../infra/control-plane
./gradlew bootRun

# Stop the development environment
./stop.sh
```

## Services

- **PostgreSQL**: localhost:5432
  - Database: `control_plane_db`
  - Username: `control_plane_user`
  - Password: `control_plane_pass`

- **PgAdmin**: http://localhost:5050
  - Email: `admin@control-plane.local`
  - Password: `admin`

## Database Management

The Control Plane service uses Flyway for database migrations. Schema and seed data are managed in:
- `infra/control-plane/src/main/resources/db/migration/`

Migrations run automatically when the Control Plane service starts.

## Development Workflow

1. Start the database: `./start.sh`
2. Start the Control Plane service: `cd ../../infra/control-plane && ./gradlew bootRun`
3. Access the API at: http://localhost:8080
4. View database in PgAdmin: http://localhost:5050

## File Structure

```
dev/control-plane/
├── docker-compose.dev.yml  # Database and PgAdmin services
├── start.sh               # Start development environment
├── stop.sh                # Stop development environment
└── README.md              # This file
```

## Other Services

Future services should follow the same pattern:
```
dev/
├── control-plane/         # This service
├── another-service/       # Future service
│   ├── docker-compose.dev.yml
│   ├── start.sh
│   └── stop.sh
└── README.md              # Overall dev environment docs
```