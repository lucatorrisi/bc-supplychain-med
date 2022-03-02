import json
from web3 import Web3, HTTPProvider
from web3.contract import ConciseContract

# web3.py instance
w3 = Web3(HTTPProvider("https://ropsten.infura.io/v3/1be98c0a50ad4e9384e56e257aa5446a"))
key="0x6e95e0ac095d7346e5a07a32a4a9a2330cce26ac8444a89c9f75efcd5adb211d"

print(w3.isConnected())

acct = w3.eth.account.privateKeyToAccount(key)

# compile your smart contract with truffle first
truffleFile = json.load(open('../build/contracts/ArchiveCertification.json'))
abi = truffleFile['abi']
bytecode = truffleFile['bytecode']
contract= w3.eth.contract(bytecode=bytecode, abi=abi)

#building transaction
construct_txn = contract.constructor().buildTransaction({
    'from': acct.address,
    'nonce': w3.eth.getTransactionCount(acct.address),
    'gas': 4712388,
    'gasPrice': w3.toWei('21', 'gwei')})

signed = acct.signTransaction(construct_txn)

tx_hash=w3.eth.sendRawTransaction(signed.rawTransaction)
print(tx_hash.hex())
tx_receipt = w3.eth.waitForTransactionReceipt(tx_hash)
print("Contract Deployed At:", tx_receipt['contractAddress'])
