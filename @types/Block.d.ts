export interface IBlockHeader {
    version: string;
    height: number;
    timestamp: number;
    previousHash: string;
}

export interface IBlock extends IBlockHeader {
    merkleRoot: string;
    hash: string;
    nonce: number;
    height: number;
    data: string[];
}
