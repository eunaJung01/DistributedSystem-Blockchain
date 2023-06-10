import {WebSocket} from "ws";
import {Failable} from "Failable";
import {Chain} from "../core/blockchain/chain";
import {Block} from "../core/blockchain/block";

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

export class P2PServer extends Chain {
    private sockets: WebSocket[];

    constructor() {
        super();
        this.sockets = [];
    }

    public getSockets() {
        return this.sockets;
    }

    /**
     * Server
     * 클라이언트가 연결을 시도했을 때 실행되는 코드
     */
    public listen() {
        const server = new WebSocket.Server({port: 7545});

        // Client와 웹 소켓이 연결되었을 때 connectSocket() 메서드가 실행된다.
        server.on("connection", (socket) => {
            console.log("webSocket connected");
            this.connectSocket(socket);
        });
    }

    /**
     * Client
     * 서버 쪽으로 연결 요청 시 실행되는 코드
     * @param newPeer 요청을 보낼 URL
     */
    public connectToPeer(newPeer: string) {
        // 해당 URL(newPeer)을 가지고 있는 노드와 웹 소켓이 연결된다.
        const socket = new WebSocket(newPeer);

        // 웹 소켓이 연결되었을 때 Client 입장에서의 이벤트명 : open
        // open 이벤트 발생 이후 connectSocket() 메서드가 실행된다.
        socket.on("open", () => {
            this.connectSocket(socket);
        });
    }

    public connectSocket(socket: WebSocket) {
        // 연결된 소켓 정보를 배열에 담아 저장한다. (향후 broadcasting을 하기 위함)
        this.sockets.push(socket);

        this.messageHandler(socket); // 데이터를 전달받을 수 있는 준비 상태가 만들어진다.

        const data: Message = {
            type: MessageType.latest_block,
            payload: {},
        }
        this.errorHandler(socket);

        const send = P2PServer.send(socket);
        send(data); // 데이터를 전달한다.
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
                    // 체인에 블록을 추가할지 말지를 결정해야 한다.
                    const [receivedBlock] = result.payload; // [this.getLatestBlock()]
                    const isValid = this.addToChain(receivedBlock);
                    if (!isValid.isError) { // addToChain이 성공했을 때에는 추가적인 요청이 필요하지 않다.
                        break;
                    }
                    const message: Message = {
                        type: MessageType.receivedChain,
                        payload: this.getChain(),
                    }
                    send(message);
                    break;
                }
                case MessageType.receivedChain: {
                    const receivedChain: Block[] = result.payload;
                    // 체인을 교체할지 말지를 결정해야 한다. (보다 긴 체인을 선택)
                    this.handleChainResponse(receivedChain);
                    break;
                }
                case MessageType.receivedTx: {
                    const receivedTransaction: ITransaction = result.payload;
                    if (receivedTransaction === null) {
                        break;
                    }

                    const withTransaction = this.getTransactionPool().find((_tx: ITransaction) => {
                        return _tx.hash === receivedTransaction.hash;
                    });

                    // 내 풀에 받은 트랜잭션 내용이 없다면 추가한다.
                    if (!withTransaction) {
                        this.appendTransactionPool(receivedTransaction);
                        const message: Message = {
                            type: MessageType.receivedTx,
                            payload: receivedTransaction,
                        };
                        this.broadcast(message);
                    }
                    break;
                }
            }
        };

        // socket.on() 메서드에 의해 "message" 이벤트가 발생했을 때 (즉, 데이터를 전달 받았을 때)
        // 두 번째 인자값으로 들어간 callback 함수가 실행되게 된다.
        socket.on("message", callback);
    }

    private errorHandler(socket: WebSocket) {
        const close = () => {
            this.sockets.splice(this.sockets.indexOf(socket), 1);
        };

        // socket이 끊겼을 경우 (즉, "close" 이벤트가 발생했을 때)
        socket.on("close", close);

        // error가 발생했을 경우 (즉, "error" 이벤트가 발생했을 때)
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

    public broadcast(message: Message): void {
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
