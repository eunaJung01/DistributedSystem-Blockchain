import {Block} from "@core/blockchain/block";
import {Failable} from "Failable";
import {DIFFICULTY_ADJUSTMENT_INTERVAL, GENESIS} from "@core/config";

export class Chain {
    public blockchain: Block[];

    constructor() {
        this.blockchain = [Block.getGENESIS()];
    }

    public getChain(): Block[] {
        return this.blockchain;
    }

    public getLength(): number {
        return this.blockchain.length;
    }

    public getLatestBlock(): Block {
        return this.blockchain[this.getLength() - 1];
    }

    public addBlock(data: string[]): Failable<Block, string> {
        const previousBlock: Block = this.getLatestBlock();
        const adjustmentBlock: Block = this.getAdjustmentBlock();
        const newBlock: Block = Block.generateBlock(previousBlock, data, adjustmentBlock);
        const isValid: Failable<Block, string> = Block.isValidNewBlock(newBlock, previousBlock);

        if (isValid.isError) {
            return {isError: true, error: isValid.error};
        }
        this.blockchain.push(newBlock);
        return {isError: false, value: newBlock};
    }

    // difficulty 계산용 블록을 반환한다.
    private getAdjustmentBlock(): Block {
        const curLength = this.getLength();
        if (curLength < DIFFICULTY_ADJUSTMENT_INTERVAL) {
            return GENESIS;
        }
        if (curLength % 10 === 0) {
            return this.blockchain[curLength - DIFFICULTY_ADJUSTMENT_INTERVAL];
        }
        return this.getLatestBlock(); // GENESIS 블록 또는 -10번째 블록
    }
}
