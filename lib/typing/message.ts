namespace TcpMessage {
    export interface IBasicMessage {
        type: string;
        data: any;
    }
    export interface IPushMessage extends IBasicMessage {
        route: string;
    }

    export interface IRequestMessage extends IBasicMessage {
        requestId: number;
        route: string;
    }

    export interface IResponseMessage extends IBasicMessage {
        requestId: number;
        code: number;
    }
}

namespace ProcessMessage {
    export interface IBasicMessage {
        type: string;
        data: any;
    }
    export interface IPushMessage extends IBasicMessage {
        route: string;
    }

    export interface IRequestMessage extends IBasicMessage {
        requestId: number;
        route: string;
    }

    export interface IResponseMessage extends IBasicMessage {
        requestId: number;
        code: number;
    }
}