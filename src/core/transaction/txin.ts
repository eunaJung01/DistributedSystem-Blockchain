export class TxIn {
    public txOutId: string;
    public txOutIndex: number; // txOuts 배열의 index 값
    public signature?: string;

    constructor(_txOutId: string, _txOutIndex: number, _signature: string | undefined = undefined) {
        this.txOutId = _txOutId;
        this.txOutIndex = _txOutIndex;
        this.signature = _signature;
    }

    public static createTxIns(_receivedTx: any, _myUTXO: IUnspentTxOut[]) {
        let sum = 0;
        let txIns: TxIn[] = [];

        for (let i = 0; i < _myUTXO.length; i++) {
            const {txOutId, txOutIndex, amount} = _myUTXO[i];
            const item: TxIn = new TxIn(txOutId, txOutIndex, _receivedTx.signature);

            txIns.push(item);
            sum += amount;

            if (sum >= _receivedTx.amount) {
                return {sum, txIns};
            }
        }
        return {sum, txIns};
    }

}
