import {TxIn} from "./txin";
import {TxOut} from "./txout";
import {UnspentTxOut} from "./unspentTxOut";
import {SHA256} from "crypto-js";

export class Transaction {
    public hash: string;
    public txIns: TxIn[];
    public txOuts: TxOut[];

    constructor(_txIns: TxIn[], _txOuts: TxOut[]) {
        this.txIns = _txIns;
        this.txOuts = _txOuts;
        this.hash = this.createTransactionHash();
    }

    private createTransactionHash(): string {
        const txOutContext: string = this.txOuts.map((v) => Object.values(v).join('')).join('');
        const txInContext: string = this.txIns.map((v) => Object.values(v).join('')).join('');
        console.log(txOutContext, txInContext);
        return SHA256(txOutContext + txInContext).toString();
    }

    private createUTXO(): UnspentTxOut[] {
        return this.txOuts.map((txOut: TxOut, index: number) => {
            return new UnspentTxOut(this.hash, index, txOut.account, txOut.amount);
        });
    }

}
