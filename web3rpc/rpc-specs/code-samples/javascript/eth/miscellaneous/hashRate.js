const { JsonRpcProvider } = require("@kaiachain/ethers-ext");
(() => {
  const provider = new JsonRpcProvider("https://public-en-baobab.klaytn.net");
  provider.eth
    .hashrate({}, (err, data, response) => {})
    .then((data) => {
      console.log(data);
    });
})();
