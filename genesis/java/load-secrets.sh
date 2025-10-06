#!/bin/bash

# Load secrets from external config file
CONFIG_DIR="${REALM_CONFIG_DIR:-$HOME/.realm-mesh}"
CONFIG_FILE="$CONFIG_DIR/secrets.env"

if [ -f "$CONFIG_FILE" ]; then
    echo "Loading secrets from $CONFIG_FILE"
    source "$CONFIG_FILE"
    export REGISTRY_API_KEY
else
    echo "Warning: No secrets file found at $CONFIG_FILE"
    echo "Create it with: mkdir -p $CONFIG_DIR && cp .env.example $CONFIG_FILE"
    echo "Then update the REGISTRY_API_KEY in $CONFIG_FILE"
    exit 1
fi