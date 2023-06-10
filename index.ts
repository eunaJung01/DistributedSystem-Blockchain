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
}

interface Message {
    type: MessageType;
    payload: any;
}

app.get("/", (req, res) => {
    res.send("bit-chain");
});

// 블록 내용 조회 API
app.get("/chains", (req, res) => {
    res.json(ws.getChain());
});

// 블록 채굴 API
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

// ws 연결 요청 API
app.post("/addToPeer", (req, res) => {
    const {peer} = req.body;
    console.log(peer);
    ws.connectToPeer(peer);
    res.json();
});

// 연결된 sockets 조회
app.get("/peers", (req, res) => {
    const sockets = ws.getSockets().map((s: any) => {
        return s._socket.remoteAddress + ':' + s._socket.remotePort;
    });
    res.json(sockets);
});

// sendTransaction 라우터 추가
app.post("/sendTransaction", (req, res) => {
    try {
        const receivedTx: ReceivedTx = req.body;
        Wallet.sendTransaction(receivedTx);
    } catch (e) {
        if (e instanceof Error) console.log(e.message);
    }
    res.json({});
});

app.listen(3000, () => {
    console.log("server onload # port: 3000");
    ws.listen();
});

// app.listen(3001, () => {
//     console.log("server onload # port: 3001");
//     ws.listen();
// });
