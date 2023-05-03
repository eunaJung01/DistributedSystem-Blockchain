import {SHA256} from 'crypto-js';
import merkle from 'merkle';
import {BlockHeader} from './blockHeader';
import {IBlock} from "Block";

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

    public static getMerkleRoot<T>(_data: T[]): string {
        const merkleTree = merkle('sha256').sync(_data);
        return merkleTree.root() || "0".repeat(64);
    }

    public static createBlockHash(_block: Block): string {
        const {version, timestamp, merkleRoot, previousHash, height} = _block;
        const values: string = `${version}${timestamp}${merkleRoot}${previousHash}${height}`;
        return SHA256(values).toString();
    }
}
