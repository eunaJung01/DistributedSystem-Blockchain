export interface IBlock {
    merkleRoot: string;
    hash: string;
    data: string[];
    height: number;
}

export interface IBlockHeader {
    version: string;
    height: number;
    timestamp: number;
    previousHash: string;
}
