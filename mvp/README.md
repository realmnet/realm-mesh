# RealmMesh MVP Demo

See agents coordinate in real-time!

## Quick Start

```bash
# Install dependencies
npm run setup

# Run the demo
npm run demo
```

This will:
1. Start the Gateway (WebSocket server)
2. Open the Web Console in your browser
3. Launch two agents (Pricing & Inventory)
4. Run a demo scenario showing agent coordination

## What You'll See

- **Web Console**: Real-time visualization of agent activity at http://localhost:3000
- **Terminal**: Color-coded logs from each component
- **Demo Scenario**: Agents bidding and coordinating on a price check

## Architecture

```
Gateway (WebSocket Server - :3001, :8080, :8443)
    ↕
├─ Console (React UI - :3000)
├─ PricingAgent (calculates prices)
├─ InventoryAgent (checks stock)
└─ DemoScenario (initiates loops)
```

## How It Works

1. **Gateway starts** - WebSocket server ready for connections
2. **Console loads** - Shows empty realm list initially
3. **Agents connect** - Register with capabilities (pricing, inventory)
4. **Console updates** - Shows connected agents in real-time
5. **Scenario runs** - Initiates a "PriceCheck" loop
6. **Loop coordination**:
   - Gateway broadcasts recruitment to agents
   - Agents bid/accept participation
   - Gateway coordinates execution
   - Results are aggregated and returned

## Loop Execution Flow

```
Scenario → Gateway → [Pricing Agent, Inventory Agent]
    ↓         ↓              ↓              ↓
  Loop     Broadcast    Calculate       Check Stock
 Initiate  Recruitment    Price          Available
    ↓         ↓              ↓              ↓
 Gateway  ← Recruitment ← Accept        ← Accept
    ↓      Responses      Participation   Participation
    ↓         ↓              ↓              ↓
 Execute → Coordinate → Calculate      → Return Stock
  Phase     Execution    Final Price     Status
    ↓         ↓              ↓              ↓
 Aggregate ← Results   ← Price: $75    ← In Stock: 50
  Results      ↓
    ↓          ↓
 Complete → Scenario
   Loop
```

## Manual Testing

Start individual components:

```bash
# Terminal 1 - Gateway
cd ../infra/gateway && npm run dev

# Terminal 2 - Console
cd ../console && npm run dev

# Terminal 3 - Pricing Agent
cd agents/pricing-agent && npm start

# Terminal 4 - Inventory Agent
cd agents/inventory-agent && npm start

# Terminal 5 - Run Scenario
node scenarios/price-check-scenario.js
```

## Press Ctrl+C to stop the demo

## Troubleshooting

- **"ECONNREFUSED"**: Make sure the gateway is running first
- **No agents in console**: Check that agents successfully connected to gateway
- **Loop fails**: Ensure at least one agent accepts the recruitment

## Next Steps

- Add more agent types (notification, payment, etc.)
- Implement different loop types (voting, consensus)
- Add real SDK integration
- Create more complex scenarios