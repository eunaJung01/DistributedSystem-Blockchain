import {Failable} from "Failable";
import {Block} from "./block";
import {DIFFICULTY_ADJUSTMENT_INTERVAL, GENESIS} from "../config";
import {TxIn} from "../transaction/txin";
import {TxOut} from "../transaction/txout";
import {Transaction} from "../transaction/transaction";
import {UnspentTxOut} from "../transaction/unspentTxOut";
import {IBlock} from "Block";

export class Chain {
    private blockchain: Block[];
    private unspentTxOuts: IUnspentTxOut[];
    private transactionPool: ITransaction[];

    constructor() {
        this.blockchain = [Block.getGENESIS()];
        this.unspentTxOuts = [];
        this.transactionPool = [];
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

    /*
    public appendUTXO(utxo: UnspentTxOut[]): void {
        this.unspentTxOuts.push(...utxo);
    }
     */

    public getTransactionPool(): ITransaction[] {
        return this.transactionPool;
    }

    public appendTransactionPool(_transaction: ITransaction): void {
        this.transactionPool.push(_transaction);
    }

    public miningBlock(_account: string): Failable<Block, string> {
        // TODO: Transaction 객체 생성
        const txin: ITxIn = new TxIn('', this.getLatestBlock().height + 1);
        const txout: ITxOut = new TxOut(_account, 50);
        const coinbaseTransaction: Transaction = new Transaction([txin], [txout]);
        /*
        const utxo = coinbaseTransaction.createUTXO();
        this.appendUTXO(utxo);
         */

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

        // UTXO 업데이트
        newBlock.data.forEach((_tx: ITransaction) => {
            this.updateUTXO(_tx);
        });

        // 트랜잭션 풀 최신화
        // 블록이 생성되었다면 트랜잭션 풀에 있는 트랜잭션은 제거한다.
        this.updateTransactionPool(newBlock);

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

        // UTXO & 트랜잭션 풀 업데이트
        this.blockchain.forEach((_block: IBlock) => {
            this.updateTransactionPool(_block);
            _block.data.forEach((_tx: ITransaction) => {
                this.updateUTXO(_tx);
            });
        });

        return {isError: false, value: undefined}
    }

    public updateUTXO(_tx: ITransaction): void {
        const unspentTxOuts: UnspentTxOut[] = this.getUnspentTxOuts();

        // UTXO에 추가할 unspentTxOut 객체 생성
        const newUnspentTxOuts = _tx.txOuts.map((txout, index) => {
            return new UnspentTxOut(_tx.hash, index, txout.account, txout.amount);
        });

        // 1. UTXO에서 사용한 unspentTxOut 객체는 제거한다.
        // 2. 생성된 unspentTxOut 객체를 UTXO에 추가한다.
        const tmp = unspentTxOuts
            .filter((_v: UnspentTxOut) => {
                const bool = _tx.txIns.find((v: TxIn) => {
                    return _v.txOutId === v.txOutId && _v.txOutIndex === v.txOutIndex;
                });
                return !bool;
            })
            .concat(newUnspentTxOuts);

        let unspentTmp: UnspentTxOut[] = [];
        this.unspentTxOuts = tmp.reduce((acc, utxo) => {
            const find = acc.find(({txOutId, txOutIndex}) => {
                return txOutId === utxo.txOutId && txOutIndex === utxo.txOutIndex;
            });
            if (!find) acc.push(utxo);
            return acc;
        }, unspentTmp);
    }

    // 트랜잭션 풀 최신화
    public updateTransactionPool(_newBlock: IBlock) {
        let txPool: ITransaction[] = this.getTransactionPool();

        _newBlock.data.forEach((tx: ITransaction) => {
            txPool = txPool.filter((txp) => {
                txp.hash !== tx.hash;
            });
        });

        this.transactionPool = txPool;
    }

}
