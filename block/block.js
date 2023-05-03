import merkle from 'merkle';
import SHA256 from 'crypto-js/sha256.js';

export class BlockHeader {
    constructor(_height, _previousHash) {
        this.version = BlockHeader.getVersion();
        this.height = _height;
        this.timestamp = BlockHeader.getTimestamp();
        this.previousHash = _previousHash || '0'.repeat(64);
    }

    static getVersion() {
        return '1.0.0';
    }

    static getTimestamp() {
        return Number(new Date());
    }
}

export class Block {
    constructor(_header, _data) {
        const merkleRoot = Block.getMerkleRoot(_data);

        this.version = _header.version;
        this.height = _header.height;
        this.timestamp = _header.timestamp;
        this.previousHash = _header.previousHash;
        this.hash = Block.createBlockHash(_header, merkleRoot);
        this.merkleRoot = merkleRoot;
        this.data = _data;
    }

    static getMerkleRoot(_data) {
        const merkleTree = merkle('sha256').sync(_data);
        return merkleTree.root();
    }

    static createBlockHash(_header, merkleRoot) {
        const values = Object.values(_header);
        const data = values.join("") + merkleRoot;
        return SHA256(data).toString();
    }

    static generateBlock(_previousBlock: Block,
                         _data: string[],
                         _adjustmentBlock: Block,) {
        const generated = new Block(_previousBlock, _data, _adjustmentBlock);
        return Block.findBlock(generated);
    }

    static findBlock(_generated: Block) {
        // TODO: 난이도에 따른 nonce 값을 구하는 함수 작성
        return _generated;
    }
}
