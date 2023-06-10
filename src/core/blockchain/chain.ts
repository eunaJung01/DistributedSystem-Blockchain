import {Failable} from "Failable";
import {Block} from "./block";
import {DIFFICULTY_ADJUSTMENT_INTERVAL, GENESIS} from "../config";
import {TxIn} from "../transaction/txin";
import {TxOut} from "../transaction/txout";
import {Transaction} from "../transaction/transaction";
import {UnspentTxOut} from "../transaction/unspentTxOut";

export class Chain {
    private blockchain: Block[];
    private unspentTxOuts: IUnspentTxOut[];

    constructor() {
        this.blockchain = [Block.getGENESIS()];
        this.unspentTxOuts = [];
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

    public getUnspentTxOuts(): IUnspentTxOut[] {
        return this.unspentTxOuts;
    }

    public appendUTXO(utxo: UnspentTxOut[]): void {
        this.unspentTxOuts.push(...utxo);
    }

    public miningBlock(_account: string): Failable<Block, string> {
        // TODO: Transaction 객체 생성
        const txin: ITxIn = new TxIn('', this.getLatestBlock().height + 1);
        const txout: ITxOut = new TxOut(_account, 50);
        const coinbaseTransaction: Transaction = new Transaction([txin], [txout]);
        const utxo = coinbaseTransaction.createUTXO();
        this.appendUTXO(utxo);

        // TODO: addBlock() 호출
        return this.addBlock([coinbaseTransaction]);
    }

    public addBlock(data: ITransaction[]): Failable<Block, string> {
        const previousBlock: Block = this.getLatestBlock();
        const adjustmentBlock: Block = this.getAdjustmentBlock(); // 10번째 전 블록 구하기
        const newBlock: Block = Block.generateBlock(previousBlock, data, adjustmentBlock);
        const isValid: Failable<Block, string> = Block.isValidNewBlock(newBlock, previousBlock);

        if (isValid.isError) {
            return {isError: true, error: isValid.error};
        }
        this.blockchain.push(newBlock);
        return {isError: false, value: newBlock};
    }

    // difficulty 계산용 블록 반환
    // 생성 시점 기준으로 블록 높이가 -10인 블록을 구한다.
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

    public addToChain(_receivedBlock: Block): Failable<undefined, string> {
        const isValid = Block.isValidNewBlock(_receivedBlock, this.getLatestBlock());
        if (isValid.isError) {
            return {isError: true, error: isValid.error}
        }

        this.blockchain.push(_receivedBlock);
        return {isError: false, value: undefined}
    }

    // Chain 검증
    public isValidChain(_chain: Block[]): Failable<undefined, string> {
        if (JSON.stringify(_chain[0]) !== JSON.stringify(this.blockchain[0])) {
            return {isError: true, error: "GENESIS 블록이 다릅니다."}
        }
        for (let i = 1; i < _chain.length; i++) {
            const newBlock = _chain[i];
            const previousBlock = _chain[i - 1];
            const isValid = Block.isValidNewBlock(newBlock, previousBlock);
            if (isValid.isError) {
                return {isError: true, error: isValid.error}
            }
        }
        return {isError: false, value: undefined}
    }

    // Chain 교체
    public replaceChain(receivedChain: Block[]): Failable<undefined, string> {
        const latestReceivedBlock: Block = receivedChain[receivedChain.length - 1];
        const latestBlock: Block = this.getLatestBlock();
        if (latestReceivedBlock.height === 0) {
            return {isError: true, error: "받은 체인의 최신 블록이 제네시스 블록입니다."}
        }
        if (latestReceivedBlock.height <= latestBlock.height) {
            return {isError: true, error: "자신의 체인이 더 길거나 같습니다."}
        }
        // 내 체인이 더 짧다면 체인을 바꿔준다.
        this.blockchain = receivedChain;
        return {isError: false, value: undefined}
    }
}
