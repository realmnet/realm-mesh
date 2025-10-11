# QuickStart Guide

## New Developer Setup (One Command!)

Just cloned the repo? Run this:

```bash
make dev
```

This single command will:
- Generate all `.env` files with sensible defaults
- Install all dependencies (broker, console, SDK, MVP)
- Start PostgreSQL database
- Apply Prisma database schema
- Show you what to do next

Then start the services in separate terminals:
```bash
# Terminal 1
make broker-dev

# Terminal 2
make console-dev
```

## Run the Full MVP Demo

Want to see everything in action? One command:

```bash
make mvp
```

This automatically:
- Sets up environment and dependencies
- Starts database
- Launches broker service
- Starts pricing and inventory agents
- Runs the price-check scenario
- Shows you the demo in action!

## Troubleshooting

### Port Already in Use

If you see:
```
❌ ERROR: Port 5433 is already in use!
```

**Option 1: Stop the conflicting process**
```bash
lsof -ti :5433 | xargs kill
make broker-db-up
```

**Option 2: Change the port**
Edit the `Makefile` (line 28):
```makefile
DB_PORT := 5434  # Change from 5433
```

**Option 3: Clean up old Docker containers**
```bash
make broker-db-down
make broker-db-up
```

### Missing .env Files

The Makefile auto-generates `.env` files, but if you need to regenerate them:

```bash
make env-setup           # Generates all .env files
make env-broker          # Just broker .env
make env-console         # Just console .env.local
make env-mvp             # Just mvp .env
```

All configuration is in the `Makefile` (lines 22-52), so you can customize:
- Database ports
- API keys
- Service ports
- Environment settings

### Database Schema Issues

Reset the database and reapply schema:

```bash
make broker-db-reset
```

This will:
- Destroy all data (be careful!)
- Recreate the database
- Apply Prisma schema
- Generate Prisma client

## What Gets Auto-Configured

All non-sensitive configuration is stored in the Makefile:

| Variable | Default | What it's for |
|----------|---------|---------------|
| DB_PORT | 5433 | PostgreSQL port |
| ADMIN_PORT | 3001 | Broker admin API |
| INTERNAL_PORT | 8080 | Internal broker (realms) |
| EXTERNAL_PORT | 8443 | External broker (partners) |
| CONSOLE_PORT | 3000 | Web console UI |
| ADMIN_API_KEY | admin-key-123 | Dev API key |

Change these in the Makefile and run `make env-setup` to regenerate config files.

## Available Commands

```bash
make help              # Show all commands
make dev               # Setup dev environment (one command)
make mvp               # Run full MVP demo (one command)
make broker-dev        # Start broker with hot reload
make console-dev       # Start web console
make broker-db-up      # Start database
make broker-db-down    # Stop database
make broker-db-reset   # Reset database (destroys data!)
make broker-db-shell   # Open PostgreSQL shell
make kill-all          # Kill all running processes
```

## Architecture Overview

```
realm-mesh/
├── broker/
│   ├── service/        # Core broker service (WebSocket gateway)
│   └── console/        # Web UI (Next.js)
├── mvp/                # MVP demo scenarios
│   ├── agents/         # Sample agents (pricing, inventory)
│   └── scenarios/      # Demo scripts
├── sdk/node/           # Node.js SDK for building realms
└── Makefile            # One-command workflows
```

## Next Steps

1. Start the broker and console (see above)
2. Open http://localhost:3000 to see the console
3. Run `make mvp` to see agents in action
4. Check the MVP scenarios in `mvp/scenarios/` to learn the patterns
5. Build your own realms using the SDK in `sdk/node/`

Happy hacking! 🚀
