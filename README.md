# pusher-service
A library that wraps the pusher service and performs automatic compression/decompression on send/recv in order to stay under the pusher 10KB payload limit

### package.json
  "dependencies": {
    "pusher-service": "git+https://github.com/world-travel-inc/pusher-service.git"
  }

### module
  const pusherService = require('pusher-service');