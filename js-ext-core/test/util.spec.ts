import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits as formatEthUnits, parseUnits as parseEthUnits, formatEther, parseEther } from "@ethersproject/units";
import { assert } from "chai";

import {
  TxType,
  isBasicTxType,
  isFeeDelegationTxType,
  isKlaytnTxType,
  isPartialFeeDelegationTxType,
  getSignatureTuple,
  getRpcTxObject,
  formatKlayUnits,
  formatKlay,
  parseKlayUnits,
  parseKlay,
  decryptKeystoreList,
  decryptKeystoreListSync,
} from "../src";


describe("util", () => {
  it("TxType", () => {
    // Eth types are not Klaytn TxType
    assert.isFalse(isKlaytnTxType(0));
    assert.isFalse(isBasicTxType(0));
    assert.isFalse(isFeeDelegationTxType(1));
    assert.isFalse(isPartialFeeDelegationTxType(2));

    let ty = TxType.ValueTransfer;
    assert.isTrue(isBasicTxType(ty));
    assert.isFalse(isFeeDelegationTxType(ty));
    assert.isFalse(isPartialFeeDelegationTxType(ty));

    ty = TxType.FeeDelegatedSmartContractExecution;
    assert.isFalse(isBasicTxType(ty));
    assert.isTrue(isFeeDelegationTxType(ty));
    assert.isFalse(isPartialFeeDelegationTxType(ty));

    ty = TxType.FeeDelegatedCancelWithRatio;
    assert.isFalse(isBasicTxType(ty));
    assert.isFalse(isFeeDelegationTxType(ty));
    assert.isTrue(isPartialFeeDelegationTxType(ty));
  });

  it("getSignatureTuple", () => {
    const vNum = 27;
    const vHex = "0x1b";
    const rHex = "0x66809fb130a6ea4ae4e823baa92573a5f1bfb4e88e64048aecfb18a2b4012b99";
    const sHex = "0x75c2c3e5f7b0a182c767137c488649cd5104a5e747371fd922d618e328e5c508";
    const canonical = [vHex, rHex, sHex];

    const testcases = [
      // tuple
      [vHex, rHex, sHex],

      // object
      { v: vNum, r: rHex, s: sHex },
      { recoveryParam: 0, r: rHex, s: sHex },

      // compact
      ("0x" + rHex.substring(2) + sHex.substring(2)),
      ("0x" + rHex.substring(2) + sHex.substring(2) + vHex.substring(2)),
    ];

    for (const tc of testcases) {
      let tuple = getSignatureTuple(tc as any);
      assert.deepEqual(tuple, canonical);
    }
  });

  it("getRpcTxObject", () => {
    let tx = {
      chainId: 42,
      gasLimit: 0x1111,
      gasPrice: 0x222,
      type: 2,
      maxFeePerGas: 0x33,
      maxPriorityFeePerGas: 0x4,
      nonce: 0,
      value: 0,

      from: "0x00000000000000000000000000000000000000aa",
      to: "0x00000000000000000000000000000000000000bb",
      data: "0x",
    };

    let formatted = getRpcTxObject(tx);
    assert.deepEqual(formatted, {
      chainId: "0x2a",
      gas: "0x1111",
      gasPrice: "0x222",
      type: "0x2",
      maxFeePerGas: "0x33",
      maxPriorityFeePerGas: "0x4", // numeric (QUANTITY) encoded without leading zeros
      nonce: "0x0",
      value: "0x0", // zero numeric (QUANTITY) encoded to 0x0

      from: "0x00000000000000000000000000000000000000aa",
      to: "0x00000000000000000000000000000000000000bb",
      data: "0x", // empty bytestring (DATA) encoded to 0x
    });
  });

  describe("formatUnits", () => {
    it("klay units", () => {
      // unit names are case-insensitive.
      const peb = BigNumber.from("1000000000000000000"); // 1e18 peb

      assert.equal(formatKlayUnits(peb, "ston"), "1000000000.0"); // = 1e9 ston
      assert.equal(formatKlayUnits(peb, "gpeb"), "1000000000.0"); // = 1e9 gpeb

      assert.equal(formatKlayUnits(peb, "klay"), "1.0"); // = 1 KLAY
      assert.equal(formatKlayUnits(peb, "KLAY"), "1.0"); // = 1 KLAY
      assert.equal(formatKlay(peb), "1.0");

      assert.equal(formatKlayUnits(peb, "mKLAY"), "1000.0"); // = 1e3 mKLAY
      assert.equal(formatKlayUnits(peb, "MKLAY"), "0.000001"); // = 1e-6 MKLAY
    });

    it("eth units", () => {
      const wei = BigNumber.from("1000000000000000000"); // 1e18 wei
      assert.equal(formatKlayUnits(wei, "gwei"), formatEthUnits(wei, "gwei"));
      assert.equal(formatKlayUnits(wei, "ether"), formatEthUnits(wei, "ether"));
      assert.equal(formatKlay(wei), formatEther(wei));
    });
  });

  describe("parseUnits", () => {
    it("klay units", () => {
      assert.equal(parseKlayUnits("25.0", "ston").toString(), "25000000000"); // 25 ston = 25e9 peb
      assert.equal(parseKlayUnits("25.0", "gpeb").toString(), "25000000000"); // 25 gpeb = 25e9 peb

      assert.equal(parseKlayUnits("123.456", "klay").toString(), "123456000000000000000"); // 123.456 KLAY = 123.456e18 peb
      assert.equal(parseKlayUnits("123.456", "KLAY").toString(), "123456000000000000000"); // 123.456 KLAY = 123.456e18 peb
      assert.equal(parseKlay("123.456").toString(), "123456000000000000000");

      assert.equal(parseKlayUnits("1000.0", "mKLAY").toString(), "1000000000000000000"); // 1000 mKLAY = 1e18 peb
      assert.equal(parseKlayUnits("5", "MKLAY").toString(), "5000000000000000000000000"); // 5 MKLAY = 5e24 peb
    });

    it("eth units", () => {
      assert.equal(parseKlayUnits("77", "gwei").toString(), parseEthUnits("77", "gwei").toString());
      assert.equal(parseKlayUnits("77", "ether").toString(), parseEthUnits("77", "ether").toString());
      assert.equal(parseKlay("77").toString(), parseEther("77").toString());
    });
  });

  describe("keystore", () => {
    const testcases = [
      { // ethers.Wallet.createRandom().encrypt("password")
        json: '{"address":"029e786304c1531af3ac7db24a02448e543a099e","id":"9d492c95-b9e3-42e3-af73-5c77e932208d","version":3,"crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"bfcb88a1501e2bb1e6694c03da18953d"},"ciphertext":"076510b4e25d5cfc31239bffcad6036fe543cbbb04b9f3ec719bf4f61b58fc05","kdf":"scrypt","kdfparams":{"salt":"79124f05995aae98b3088d8365f59a6dfadd1c9ed249abae3c07733f4cbbee53","n":131072,"dklen":32,"p":1,"r":8},"mac":"d70f83824c2c30dc5cd3a244d87147b6aa713a6000165789a82a467651284ac7"}}',
        password: "password",
        address: "0x029e786304c1531aF3aC7db24A02448e543A099E",
        keys: ["0x1b33a48f58d8c85ab142a7375fcf18714d88271f6647cfa6b54f1be66b05a762"],
      },
      { // kcn account new --lightkdf
        json: '{"address":"ec5eaa07b4d3cbafe7bf437a1ea9a898209f617c","keyring":[[{"cipher":"aes-128-ctr","ciphertext":"0a5aa3749b9e83c2a4238445aeb66f59355c0363a54c163e34e454f76e061e47","cipherparams":{"iv":"2a0b2e02a61e0f721bd800ea6e23a588"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":4096,"p":6,"r":8,"salt":"538ead57745bcd946b05fe294de08256628d9a0a393fd29ced933ba5fc045b07"},"mac":"30b5488bc97165bc7ecac8ff8dfec65a75a8ad206450aecff0ac2dfea6f79b08"}]],"id":"362c0766-f5e3-4b4d-af22-7e89d5fb613a","version":4}',
        password: "password",
        address: "0xEc5eAa07b4d3CbAfe7bf437a1Ea9A898209F617c",
        keys: ["0x4062512193ef1dab8ccf3e3d7a4862e3c740bdf11d852954ed48bc73643e354f"],
      },
      { // https://toolkit.klaytn.foundation/misc/generateKeystore
        json: '{"version":4,"id":"2d7ad5c1-880f-4920-9b8e-51f852c4802c","address":"0x17226c9b4e130551c258eb7b1cdc927c13998cd6","keyring":[[{"ciphertext":"eb9bd884ac3cc8bf92e6b0082e9d07198bfc4c1223ccc6e5edf7452ad612b2b5","cipherparams":{"iv":"47faf7b0991a051eef698c73fc246f78"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"ba0a3e8dc49a04f8e590f8df5a590bc6e134b031ce10f46d73d4c459aa4c08f8","n":4096,"r":8,"p":1},"mac":"4978d7325e1b9b3ec9fdfd1ec709a5a86fdfade0297ea9ddeeb8c3a7a62ae898"}],[{"ciphertext":"1a80c8666bea1a8dfa3082b001ff64c818fb14cf4e02017785e0edcc7a277af4","cipherparams":{"iv":"eafbecc65ccc177a5579bf56d5f4ed31"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"6472845219e11e4de094cac8c32a6a4d13e69cd4507780a7a37f5e411e1d895d","n":4096,"r":8,"p":1},"mac":"86379236d2fd6e9bb3f99f7eebaa3325b51e9fa5ec150ade7a461555c0a14ca3"},{"ciphertext":"0071c41d2956b12be5ebc08a9a5b3a9684b9e410fe2de91d614be977fb2a0bdb","cipherparams":{"iv":"1492dfb771030d3d9c9d996c193c03e5"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"f8145aa907a649866e0fbff86011244584ddc86559cf4901f8f69b670c234fd7","n":4096,"r":8,"p":1},"mac":"eacc58c1ad717ca375697c9fcc80f463a26600f5da1b21327715bf3efa047be5"}],[{"ciphertext":"68ffc1e2800a7288ba7baba0f0f8049daeed05379fabfdd3bc017fa85c49ab50","cipherparams":{"iv":"17f22d7b8aa1a8a2948fd3629f0b89ed"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"ff5e577ec8294320cfe59ef7b1b01ee44d4c9f19c8fbc31f333059c74eb8c6d2","n":4096,"r":8,"p":1},"mac":"de65d669be044df5e39e678b099424a8692a2da6f3746832862cf2e5d6ada612"},{"ciphertext":"fd4810ee850f0aa5f61a2eafbfc5ca36cfebb42df5c2465cc8ae5188029b188b","cipherparams":{"iv":"b00ead13b38e449c268d09fced80ce49"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"af5dbbfb7383045dc7f8a3bfc56cccfc22a5150a1f87e454d40893a4b6fea9a1","n":4096,"r":8,"p":1},"mac":"6234352852eb18246b94f28f3c3454103289ecf2faaa91115927c53729bb0805"},{"ciphertext":"03b758de6372aa6bedde513ccb282bf8af32bca227c258f3e0fc85ce454d72a4","cipherparams":{"iv":"5c20f3e96d0802eaf56670e57fbe3e98"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"b5ec4e40f5a09a59e90317ce45eb7bcd73a2a9afe70f6f2e32548fd38ed2da3b","n":4096,"r":8,"p":1},"mac":"99b7f59855f0aa04531cc4a24c7923f75ed8052084de9ec49a2794e3899c3274"}]]}',
        password: "password",
        address: "0x17226c9B4e130551c258Eb7B1Cdc927c13998cd6",
        keys: [
          "0x278c3d035328daf04ab2597da96dd2d8868fd61a8837030f7d8a85f27b7f1bad",
          "0xa06d13800719307ea7e2503ea441c2ea49279d0d600a2eec2887b50928869676", "0xc32f4007ffad303db99dee0d79a720e1d70c4b2babf8e33cb28170a16bac467d",
          "0xc274d13302891d0d91a60891a48fde8c2860018f8dcb6293dcc0b28a238590b0", "0x83c127e5207b70086a702c93f1c9a041f15ce49ee5183ce848f35c64de196eff", "0x48f97204ac4886dfbd819ada04ea31a730c6fc43fcb08900566360ee7402f93b"],
      }
    ];
    it("sync", () => {
      for (const tc of testcases) {
        const account = decryptKeystoreListSync(tc.json, tc.password);
        assert.equal(account.address, tc.address);
        assert.equal(account.privateKey, tc.keys[0]);
        assert.deepEqual(account.privateKeyList, tc.keys);
      }
    });
    it("async", async () => {
      for (const tc of testcases) {
        const callback = (progress: number) => {
          // If the callback is ever going to be called, a valid progress value must be passed.
          assert.isNumber(progress);
          assert.isTrue(progress >= 0 && progress <= 1);
        };

        const account = await decryptKeystoreList(tc.json, tc.password, callback);
        assert.equal(account.address, tc.address);
        assert.equal(account.privateKey, tc.keys[0]);
        assert.deepEqual(account.privateKeyList, tc.keys);
      }
    });
  });
});