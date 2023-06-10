// Blockchain HTTP Server

import express, {Request, Response} from 'express';
import {P2PServer} from "./src/server/p2p";
import {ReceivedTx, Wallet} from "./src/core/wallet/wallet";

const app = express();
const ws = new P2PServer();

app.use(express.json());

enum MessageType {
    latest_block = 0,
    all_block = 1,
    receivedChain = 2,
    receivedTx = 3,
}

interface Message {
    type: MessageType;
    payload: any;
}

// TODO: request header의 authorization 필드를 조회한다.
// (다른 사람이 내 노드의 블록을 조회하는 것을 방지하기 위함)
app.use((req, res, next) => {
    const baseAuth: string = (req.headers.authorization || '').split(' ')[1];
    if (baseAuth === '') return res.status(401).send();

    const [userId, userPw] = Buffer.from(baseAuth, 'base64').toString().split(":");
    if (userId !== 'web7722' || userPw !== '1234') return res.status(401).send();
    next();
});

app.get("/", (req, res) => {
    res.send("bit-chain");
});

// TODO: 블록 내용 조회 API
app.get("/chains", (req, res) => {
    res.json(ws.getChain());
});

// TODO: 블록 채굴 API
app.post("/mineBlock", (req, res) => {
    const {data} = req.body;
    console.log(data);

    /*
    const newBlock = ws.addBlock(data);
    if (newBlock.isError) {
        return res.status(500).send(newBlock.error);
    }
    const message: Message = {
        type: MessageType.all_block,
        payload: [newBlock.value],
    };
     */

    // Transaction 객체를 채우기 위한 정보로 account를 전달한다.
    const newBlock = ws.miningBlock(data) // data == account

    if (newBlock.isError) {
        return res.status(500).send(newBlock.error);
    }
    const message: Message = {
        type: MessageType.latest_block,
        payload: {},
    };

    ws.broadcast(message);
    res.json(newBlock.value);
});

// TODO: ws 연결 요청 API
app.post("/addToPeer", (req, res) => {
    const {peer} = req.body;
    console.log(peer);
    ws.connectToPeer(peer);
    res.json();
});

// TODO: 연결된 sockets 조회
app.get("/peers", (req, res) => {
    const sockets = ws.getSockets().map((s: any) => {
        return s._socket.remoteAddress + ':' + s._socket.remotePort;
    });
    res.json(sockets);
});

// TODO: sendTransaction 라우터 추가
app.post("/sendTransaction", (req, res) => {
    try {
        const receivedTx: ReceivedTx = req.body;
        console.log("receivedTx : ", receivedTx);

        // 블록체인 네트워크의 진입점
        const tx = Wallet.sendTransaction(receivedTx, ws.getUnspentTxOuts());
        ws.appendTransactionPool(tx);
        ws.updateUTXO(tx);

        // 트랜잭션 broadcast
        const message: Message = {
            type: MessageType.receivedTx,
            payload: tx,
        };
        ws.broadcast(message);

    } catch (e) {
        if (e instanceof Error) console.log(e.message);
    }
    res.json({});
});

app.post("/getBalance", (req, res) => {
    const {account} = req.body;
    const balance = Wallet.getBalance(account, ws.getUnspentTxOuts());
    res.json({
        balance,
    });
});

app.listen(3000, () => {
    console.log("server onload # port: 3000");
    ws.listen();
});

// app.listen(3001, () => {
//     console.log("server onload # port: 3001");
//     ws.listen();
// });
