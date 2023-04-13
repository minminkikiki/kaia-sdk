const OpenSdk = require("opensdk-javascript");
const { expect } = require("@jest/globals");
const { RPC } = require("../../constant");

const sdk = new OpenSdk(new OpenSdk.ApiClient(RPC));

describe('eth_getFilterChanges API', () => {
    test('should return eth_getFilterChanges', (done) => {

        let callbackOne = function (error, data, response) {
            expect(error).toBeNull();
            expect(data.jsonrpc).toBe("2.0");
            expect(data.result).toBeDefined()
            done();
        };
        const id = '0x1407bf28e80aebf04cf757812428b076'
        sdk.eth.getFilterChanges(id, {}, callbackOne);
    });
});
