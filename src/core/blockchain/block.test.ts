import {Block} from "@core/blockchain/block";
import {GENESIS} from "@core/config";

describe('Block 검증', () => {
    const genesisBlock: Block = {
        version: '1.0.0',
        height: 0,
        hash: '0'.repeat(64),
        timestamp: 1231006506,
        previousHash: '0'.repeat(64),
        merkleRoot: '0'.repeat(64),
        data: ['Hello Block'],
        nonce: 0,
        difficulty: 0
    };
    it('블록 생성', () => {
        const data = ['Block #2'];
        // const newBlock = new Block(genesisBlock, data);
        // console.log(newBlock);
    });
});

describe("Block 검증", () => {
    let newBlock: Block

    it("블록 생성", () => {
        const data = ['Block #2']
        // newBlock = new Block(genesisBlock, data)
        newBlock = Block.generateBlock(GENESIS, data, GENESIS)
        // 이전 블록을 바탕으로 새로운 블록을 생성한다.
        const newBlock2 = new Block(newBlock, data, GENESIS);
    });
    it("블록 검증 테스트", () => {
        // height: 10 , height: 9
        const isValidBlock = Block.isValidNewBlock(newBlock, GENESIS);

        if (isValidBlock.isError) {
            console.error(isValidBlock.error);
            return expect(true).toBe(false);
        }
        expect(isValidBlock.isError).toBe(false);
    });
});
