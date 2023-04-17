import json
from opensdk.sdk import OpenSDK

host = "https://api.baobab.klaytn.net:8651"

file = "mutex.profile"
seconds = 10

sdk = OpenSDK(host)
debug_response = sdk.debug.mutex_profile(file, seconds)

print(json.loads(debug_response.response.data))
