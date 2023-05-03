import {SHA256} from 'crypto-js';
import merkle from 'merkle';
import {BlockHeader} from './blockHeader';
import {IBlock} from "Block";
import {Failable} from "Failable";
import {
    BLOCK_GENERATION_INTERVAL,
    BLOCK_GENERATION_TIME_UNIT,
    DIFFICULTY_ADJUSTMENT_INTERVAL,
    GENESIS
} from "@core/config";

// import hexToBinary from 'hex-to-binary';
function hex2bin(hex: string) {
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

export class Block extends BlockHeader implements IBlock {
    public hash: string;
    public merkleRoot: string;
    public nonce: number;
    public difficulty: number;
    public data: string[];

    constructor(_previousBlock: Block, _data: string[], _adjustmentBlock: Block) {
        const merkleRoot = Block.getMerkleRoot(_data);
        const _header = new BlockHeader(_previousBlock);

        super(_previousBlock); // 상속받은 클래스의 속성을 모두 가져온다.
        this.hash = Block.createBlockHash(this);
        this.merkleRoot = merkleRoot;
        this.data = _data;
        this.nonce = 0;
        this.difficulty = 0;
    }

    public static getGENESIS(): Block {
        return GENESIS;
    }

    public static getMerkleRoot<T>(_data: T[]): string {
        const merkleTree = merkle('sha256').sync(_data);
        return merkleTree.root() || "0".repeat(64);
    }

    public static createBlockHash(_block: Block): string {
        const {version, timestamp, merkleRoot, previousHash, height} = _block;
        const values: string = `${version}${timestamp}${merkleRoot}${previousHash}${height}`;
        return SHA256(values).toString();
    }

    public static generateBlock(_previousBlock: Block,
                                _data: string[],
                                _adjustmentBlock: Block): Block {
        const generateBlock = new Block(_previousBlock, _data, _adjustmentBlock);
        return Block.findBlock(generateBlock);
    }

    // Mining
    public static findBlock(_generateBlock: Block) {
        let hash: string;
        let nonce: number = 0;

        while (true) {
            nonce++;
            _generateBlock.nonce = nonce;
            hash = Block.createBlockHash(_generateBlock);

            const binary: string = hex2bin(hash);
            const result: boolean = binary.startsWith("0".repeat(_generateBlock.difficulty));
            if (result) {
                _generateBlock.hash = hash;
                return _generateBlock;
            }
        }
    }

    public static getDifficulty(_newBlock: Block,
                                _adjustmentBlock: Block,
                                _previousBlock: Block): number {
        // 1. GENESIS BLOCK이 adjustment으로 들어왔다면 난이도는 0이다.
        if (_adjustmentBlock.height === 0) {
            return 0;
        }

        // 2. interval 단위의 배수일 때만 난이도 변경 코드를 실행한다.
        // 아닐 경우에는 기존의 difficulty를 그대로 쓴다.
        if (_newBlock.height % DIFFICULTY_ADJUSTMENT_INTERVAL !== 1) {
            return _previousBlock.difficulty;
        }

        // 3. 둘 다 해당되지 않는다면 difficulty를 새로 계산한다.
        const timeTaken: number = _newBlock.timestamp - _adjustmentBlock.timestamp;
        const timeExpected: number = BLOCK_GENERATION_TIME_UNIT * BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;

        if (timeTaken == timeExpected) {
            return _adjustmentBlock.difficulty;
        }
        if (timeTaken < timeExpected / 2) {
            return _adjustmentBlock.difficulty + 1;
        }
        return _adjustmentBlock.difficulty - 1;
    }

    static isValidNewBlock(_newBlock: Block, _previousBlock: Block): Failable<Block, string> {
        if (_previousBlock.height + 1 !== _newBlock.height) {
            return {isError: true, error: "블록 높이가 맞지 않습니다."}
        }
        if (_previousBlock.hash != _newBlock.previousHash) {
            return {isError: true, error: "이전 해시 값이 맞지 않습니다."}
        }
        if (Block.createBlockHash(_newBlock) !== _newBlock.hash) {
            return {isError: true, error: "해시 값이 맞지 않습니다."}
        }
        return {isError: false, value: _newBlock};
    }
}
