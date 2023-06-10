import {Chain} from "./chain";

describe("Chain 함수 체크", () => {
    let node: Chain = new Chain(); // GENESIS

    it("getChain() 함수 체크", () => {
        console.log(node.getChain());
    });

    it("getLength() 함수 체크", () => {
        console.log(node.getLength());
    });

    it("getLatestBlock() 함수 체크", () => {
        console.log(node.getLatestBlock());
    });

    /*
    it("addBlock 함수 체크", () => {
        for (let i = 1; i <= 300; i++) {
            node.addBlock([`Block #${i}`]);
        }
        console.log(node.getChain());
    });
     */

    it("miningBlock() 함수 테스트", () => {
        for (let i = 1; i <= 5; i++) {
            node.miningBlock("15cc1446493edbe8843c40ed11526e9252f937f8");
        }
        console.log(node.getLatestBlock().data);
        console.log(node.getUnspentTxOuts());
    });

});
