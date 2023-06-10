export class TxIn {
    public txOutId: string;
    public txOutIndex: number; // txOuts 배열의 index 값
    public signature?: string;

    constructor(_txOutId: string, _txOutIndex: number, _signature: string | undefined = undefined) {
        this.txOutId = _txOutId;
        this.txOutIndex = _txOutIndex;
        this.signature = _signature;
    }
}
