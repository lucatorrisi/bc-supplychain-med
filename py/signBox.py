import pymysql
import random
import time
from time import sleep
import json
from web3 import Web3, HTTPProvider
from web3.contract import ConciseContract
import datetime
from datetime import datetime
import pyqrcode
import urllib;
from pyqrcode import QRCode
from eth_keys import keys
from eth_utils import decode_hex


class InspectDB():
    def __init__(self):
        self._conn = pymysql.connect(host='127.0.0.1', user='root', password='entra123', db='testDB')
        self._cur = self._conn.cursor()
        self._lastentry = -1
    def run(self):
        self._cur.execute("SELECT id FROM casebox_certificates ORDER BY id DESC LIMIT 1")
        for response in self._cur:
            print(response)
            self._lastentry = response[0]
            self._conn.commit()
        while True:
            self._cur.execute("SELECT * FROM casebox_certificates ORDER BY id DESC LIMIT 1")
            time.sleep(5)
            for response in self._cur:
                print(self._lastentry)
                print(response[0])
                if(self._lastentry<response[0]):
                    self._lastentry = response[0]
                    value = response[1]
                    description = response[2]
                    prvKey = '6e95e0ac095d7346e5a07a32a4a9a2330cce26ac8444a89c9f75efcd5adb211d' #this must come from another table
                    priv_key_bytes = decode_hex(prvKey)
                    priv_key = keys.PrivateKey(priv_key_bytes)
                    pubKey = priv_key.public_key
                    addressProcessOwner = pubKey.to_checksum_address()

                    print("ready to write in BC")
                    # compile your smart contract with truffle first
                    truffleFile = json.load(open('../build/contracts/caseboxCertification.json')) #start this script from the _dummy folder
                    abi = truffleFile['abi']
                    bytecode = truffleFile['bytecode']

                    # web3.py instance
                    w3 = Web3(HTTPProvider("https://ropsten.infura.io/v3/1be98c0a50ad4e9384e56e257aa5446a"))
                    privateKey="6e95e0ac095d7346e5a07a32a4a9a2330cce26ac8444a89c9f75efcd5adb211d"


                    contract_address = Web3.toChecksumAddress("0xac07caf9be06ab1f1b5eaea028a87bee22c91558")
                    print(w3.isConnected())
                    acct = w3.eth.account.privateKeyToAccount(privateKey)
                    addressContractOwner= acct.address

                    # Instantiate and deploy contract
                    contract = w3.eth.contract(abi=abi, bytecode=bytecode)
                    # Contract instance
                    contract_instance = w3.eth.contract(abi=abi, address=contract_address)
                    # Contract instance in concise mode

                    uniqueIdentifier = random.getrandbits(32);
                    txn0 = {'gas': 3000000, 'nonce': w3.eth.getTransactionCount(addressContractOwner)};
                    tx = contract_instance.functions.signCertificate(addressProcessOwner, value , description, uniqueIdentifier).buildTransaction(txn0)
                    #Get tx receipt to get contract address
                    signed_tx = w3.eth.account.signTransaction(tx, privateKey)
                    hash= w3.eth.sendRawTransaction(signed_tx.rawTransaction)
                    sleep(60)
                    print(hash.hex())
                    tsTimestamp = datetime.today()
                    tsTimestampStr = tsTimestamp.strftime('%Y-%m-%d %H:%M:%S')
                    transactionQuery = 'UPDATE casebox_certificates set addressOwner="'+addressProcessOwner+'", transactionAddress="'+hash.hex()+'", transactionTimestamp = "'+tsTimestampStr+'", uniqueIdentifier =%s where id=%s'
                    self._cur.execute(transactionQuery,(uniqueIdentifier,self._lastentry))
                    #create QRCode
                    params = {'UniqueIdentifier': uniqueIdentifier ,'Timestamp': tsTimestampStr, 'Transaction': hash.hex()}
                    QRCodeUrl = pyqrcode.create("http://localhost:3000?"+urllib.parse.urlencode(params))
                    QRCodeUrl.svg("qrCodeImg/"+tsTimestampStr+".svg",scale=8)
                    print(QRCodeUrl);

                self._conn.commit()

        cur.close()
        conn.close()

if __name__ == '__main__':
    InspectDB().run()
