import {WebSocket} from "ws";
import {Failable} from "Failable";
import {Chain} from "../core/blockchain/chain";
import {Block} from "../core/blockchain/block";

enum MessageType {
    latest_block = 0,
    all_block = 1,
    receivedChain = 2,
}

interface Message {
    type: MessageType;
    payload: any;
}

export class P2PServer extends Chain {
    private sockets: WebSocket[];

    constructor() {
        super();
        this.sockets = [];
    }

    getSockets() {
        return this.sockets;
    }

    /**
     * Server
     * 클라이언트가 연결을 시도했을 때 실행되는 코드
     */
    listen() {
        const server = new WebSocket.Server({port: 7545});

        // connection
        server.on("connection", (socket) => {
            console.log("webSocket connected");
            this.connectSocket(socket);
        });
    }

    /**
     * Client
     * 서버 쪽으로 연결 요청 시 실행되는 코드
     */
    connectToPeer(newPeer: string) {
        const socket = new WebSocket(newPeer);

        // open
        socket.on("open", () => {
            this.connectSocket(socket);
        });
    }

    connectSocket(socket: WebSocket) {
        this.sockets.push(socket);
        // socket.on("message", (data: string) => {
        //     console.log(data);
        // });
        // socket.send("message from server");

        this.messageHandler(socket);
        const data: Message = {
            type: MessageType.latest_block,
            payload: {},
        }
        this.errorHandler(socket);

        const send = P2PServer.send(socket);
        send(data);
    }

    private messageHandler(socket: WebSocket) {
        const callback = (_data: string) => {
            const result: Message = P2PServer.dataParse<Message>(_data);
            const send = P2PServer.send(socket);

            switch (result.type) {
                case MessageType.latest_block: {
                    const message: Message = {
                        type: MessageType.all_block,
                        payload: [this.getLatestBlock()],
                    }
                    send(message);
                    break;
                }
                case MessageType.all_block: {
                    const message: Message = {
                        type: MessageType.receivedChain,
                        payload: this.getChain(),
                    }
                    // TODO: 체인에 블록을 추가할지 말지를 결정해야 한다.
                    const [receivedBlock] = result.payload; // [this.getLatestBlock()]
                    const isValid = this.addToChain(receivedBlock);
                    if (!isValid.isError) { // addToChain이 성공했을 때에는 추가적인 요청이 필요하지 않다.
                        break;
                    }
                    send(message);
                    break;
                }
                case MessageType.receivedChain: {
                    const receivedChain: Block[] = result.payload;
                    // TODO: 체인을 교체하는 코드 필요 (보다 긴 체인을 선택)
                    this.handleChainResponse(receivedChain);
                    break;
                }
            }
        };
        socket.on("message", callback);
    }

    private errorHandler(socket: WebSocket) {
        const close = () => {
            this.sockets.splice(this.sockets.indexOf(socket), 1);
        };

        // socket이 끊겼을 경우
        socket.on("close", close);

        // error가 발생했을 경우
        socket.on("error", close);
    }

    private handleChainResponse(receivedChain: Block[]): Failable<Message | undefined, string> {
        const isValidChain = this.isValidChain(receivedChain);

        if (isValidChain.isError) {
            return {isError: true, error: isValidChain.error}
        }

        const isValid = this.replaceChain(receivedChain);
        if (isValid.isError) {
            return {isError: true, error: isValid.error}
        }

        // broadcast
        const message: Message = {
            type: MessageType.receivedChain,
            payload: receivedChain,
        }
        this.broadcast(message);
        return {isError: false, value: undefined}
    }

    private broadcast(message: Message): void {
        this.sockets.forEach((socket) => P2PServer.send(socket)(message));
    }

    private static send(_socket: WebSocket) {
        return (_data: Message) => {
            _socket.send(JSON.stringify(_data));
        };
    }

    private static dataParse<T>(_data: string): T {
        return JSON.parse(Buffer.from(_data).toString());
    }
}
