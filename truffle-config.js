require('dotenv').config();
const HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
    networks: {
        ganache: {
            host: "127.0.0.1",
            port: 7545,
            network_id: "*"
        },
        ropsten: {
            provider: function () {
                return new HDWalletProvider(process.env.MNEMONIC, "https://ropsten.infura.io/v3/" + process.env.INFURA_KEY);
            },
            network_id: 3,
            gas: 4500000,
            gasPrice: 10000000000
        }
    }
};
