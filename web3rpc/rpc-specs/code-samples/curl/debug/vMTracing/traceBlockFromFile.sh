curl -X 'POST' \
  'https://api.baobab.klaytn.net:8651' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "method": "debug_traceBlockFromFile",
  "id": 1,
  "jsonrpc": "2.0",
  "params": ["/home/sotatek/block.rlp"]
}'
