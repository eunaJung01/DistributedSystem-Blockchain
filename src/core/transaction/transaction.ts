import {TxIn} from "./txin";
import {TxOut} from "./txout";
import {UnspentTxOut} from "./unspentTxOut";
import {SHA256} from "crypto-js";

export class Transaction implements ITransaction {
    public hash: string;
    public txIns: ITxIn[];
    public txOuts: ITxOut[];

    constructor(_txIns: TxIn[], _txOuts: TxOut[]) {
        this.txIns = _txIns;
        this.txOuts = _txOuts;
        this.hash = this.createTransactionHash();
    }

    public createTransactionHash(): string {
        const txOutContext: string = this.txOuts.map((v) => Object.values(v).join('')).join('');
        const txInContext: string = this.txIns.map((v) => Object.values(v).join('')).join('');
        console.log(txOutContext, txInContext);
        return SHA256(txOutContext + txInContext).toString();
    }

    public createUTXO(): UnspentTxOut[] {
        return this.txOuts.map((txOut: TxOut, index: number) => {
            return new UnspentTxOut(this.hash, index, txOut.account, txOut.amount);
        });
    }

    public static createTransaction(_receivedTx: any, _myUTXO: UnspentTxOut[]): Transaction {
        // 1. utxo -> txIns[]
        const {sum, txIns} = TxIn.createTxIns(_receivedTx, _myUTXO);

        // 2. txIn -> txOuts[]
        const txOuts: TxOut[] = TxOut.createTxOuts(sum, _receivedTx);

        // 3. new Transaction()
        return new Transaction(txIns, txOuts);
    }

}
