import {Wallet} from "../wallet/wallet";

export class TxOut {
    public account: string;
    public amount: number;

    constructor(_account: string, _amount: number) {
        this.account = _account;
        this.amount = _amount;
    }

    public static createTxOuts(_sum: number, _receivedTx: any): TxOut[] {
        const {sender, received, amount} = _receivedTx;
        const receivedTxOut = new TxOut(received, amount);

        const senderAccount: string = Wallet.getAccount(sender);
        const senderTxOut = new TxOut(senderAccount, _sum - amount);

        if (senderTxOut.amount <= 0) {
            return [receivedTxOut];
        }
        return [receivedTxOut, senderTxOut];
    }

}
