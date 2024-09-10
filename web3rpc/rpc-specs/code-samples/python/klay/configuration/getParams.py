from web3 import Web3
from web3py_ext import extend

host = "https://public-en-kairos.node.kaia.io"

blockNumber = 89

w3 = Web3(Web3.HTTPProvider(host))
klay_response = w3.klay.get_params(blockNumber)

print(klay_response)
