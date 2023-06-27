declare interface ITxOut {
    account: string; // 주소
    amount: number; // 금액
}

declare interface ITxIn {
    txOutId: string; // ITransaction{}의 hash 값
    txOutIndex: number; // ITransaction에 있는 txouts 배열의 index
    signature?: string | undefined;
}

declare interface ITransaction {
    hash: string; // txIns, txOuts를 이용하여 만든 hash 값
    txOuts: ITxOut[];
    txIns: ITxIn[];
}

// TxIn : UnspentTxOut[]울 참조해서 만들어진다.
// TxIn을 만들 때는 UnspentTxOut[]애서 삭제한다.
// TxOut을 만들 때는 UnspentTxOut[]에 생성한다.
declare interface IUnspentTxOut {
    txOutId: string; // TxOut을 담고 있는 트랜잭션의 hash 값
    txOutIndex: number; // 트랜잭션의 txOuts 배열에서의 index 값
    account: string;
    amount: number;
}
