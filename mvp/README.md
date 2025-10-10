# RealmMesh MVP Demo

This MVP demonstrates two agents coordinating through the RealmMesh gateway using the Loop coordination pattern.

## Architecture

```
┌─────────────┐
│   Gateway   │  (Port 8080 - WebSocket)
└──────┬──────┘
       │
   ┌───┼───┐
   │   │   │
┌──▼─┐ │ ┌─▼──┐
│ P  │ │ │ I  │  P = PricingAgent
│    │ │ │    │  I = InventoryAgent
└────┘ │ └────┘
       │
  ┌────▼────┐
  │ Console │  (Port 3000 - Web UI)
  └─────────┘
```

## What It Does

1. **Gateway** starts and listens for WebSocket connections
2. **Two Agents** connect as clients, each providing different capabilities
3. **Scenario script** initiates a "PriceCheck" loop
4. **Agents** are recruited, execute their logic, and return results
5. **Gateway** aggregates results and returns the final answer
6. **Web Console** shows real-time activity

## Quick Start

```bash
# From the mvp directory
npm install
cd agents/pricing-agent && npm install && cd ../..
cd agents/inventory-agent && npm install && cd ../..

# Run the complete demo
npm run demo
```

This single command will:
- Start the gateway
- Start the web console
- Start both agents
- Run the demo scenario
- Show real-time coordination

## Manual Start (for debugging)

Terminal 1 - Gateway:
```bash
cd ../infra/gateway
npm run dev
```

Terminal 2 - Console:
```bash
cd ../apps/console
npm run dev
```

Terminal 3 - Pricing Agent:
```bash
cd agents/pricing-agent
npm start
```

Terminal 4 - Inventory Agent:
```bash
cd agents/inventory-agent
npm start
```

Terminal 5 - Scenario:
```bash
node scenarios/price-check-scenario.js
```

## What You'll See

### Pricing Agent Output:
```
💰 Starting PricingAgent...
✅ Connected to gateway
🤝 Handshake complete!

🔔 Recruitment for loop: PriceCheck
   ✅ ACCEPT

⚡ Executing loop: PriceCheck
   💰 Calculated price: $87.43

✅ Loop complete!
```

### Inventory Agent Output:
```
📦 InventoryAgent connecting...
✅ InventoryAgent connected!

🔔 Recruited for loop: PriceCheck
   ✓ We have stock for PROD-123

⚡ Executing: PriceCheck
   ✓ In stock: 50 units available

✅ Loop complete!
```

### Scenario Output:
```
🎬 Starting Price Check Scenario...
✅ Connected to gateway
🚀 Initiating PriceCheck loop...

📋 Recruitment complete: 2 participants

✅ Loop Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "loopId": "demo-loop-1234567890",
  "participantResults": [
    {
      "agent": "pricing-client-1",
      "result": { "price": 87.43, "confidence": 0.95 }
    },
    {
      "agent": "inventory-agent-1",
      "result": { "available": 50, "canFulfill": true }
    }
  ],
  "summary": {
    "minPrice": 87.43,
    "maxPrice": 87.43,
    "avgPrice": 87.43
  }
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Duration: 1247ms
🎉 Demo complete!
```

## Key Concepts Demonstrated

1. **Client/Agent Model**: Applications (clients) connect to the gateway and provide agents
2. **Loop Coordination**: Gateway coordinates multi-agent workflows
3. **Recruitment Phase**: Agents decide whether to participate
4. **Execution Phase**: Participating agents execute in parallel
5. **Aggregation**: Gateway combines results from all participants
6. **Real-time Updates**: Web console shows live activity

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Agents not connecting:**
- Make sure gateway is running first
- Check gateway logs for errors
- Verify WebSocket URL is correct (ws://localhost:8080)

**No output from scenario:**
- Wait 3-5 seconds for agents to connect
- Check that both agents show "Handshake complete"
- Increase timeout in demo.js if needed

## Next Steps

- Add more agents with different capabilities
- Create complex loop stacks (multi-step workflows)
- Add authentication and authorization
- Build service-to-service calls
- Implement event-driven messaging

## Architecture Details

See the main project README for full architecture documentation.
