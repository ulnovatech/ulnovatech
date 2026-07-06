#!/bin/sh
# Run a demo discovery after DB is up
curl -s -X POST http://localhost:3000/api/discovery/runs \
  -H "Content-Type: application/json" \
  -H "X-Dev-User: operator" \
  -d '{"country":"USA","city":"Austin","industry":"Restaurant"}'
