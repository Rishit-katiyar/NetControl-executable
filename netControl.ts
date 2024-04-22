import * as net from 'net';
import * as os from 'os';
import * as psutil from 'psutil';
import * as fs from 'fs';
import * as path from 'path';

// Encryption and Decryption Functions (Placeholder)
function encrypt(data: string): Buffer {
    return Buffer.from(data, 'utf-8'); // Placeholder encryption function
}

function decrypt(data: Buffer): string {
    return data.toString('utf-8'); // Placeholder decryption function
}

// Server class
class Server {
    private host: string;
    private port: number;
    private server: net.Server;
    private clients: net.Socket[];
    private computers: net.Socket[];
    private adminCommands: string[];

    constructor(host: string = '0.0.0.0', port: number = 5000) {
        this.host = host;
        this.port = port;
        this.server = net.createServer();
        this.clients = [];
        this.computers = [];
        this.adminCommands = ['host', 'unhost', 'list', 'shutdown', 'add_to_grid', 'add_to_network', 'set_device_power_state'];
        this.server.on('connection', this.handleConnection.bind(this));
    }

    start(): void {
        this.server.listen(this.port, this.host, () => {
            console.log(`Server listening on ${this.host}:${this.port}`);
        });
    }

    handleConnection(socket: net.Socket): void {
        console.log(`New client connected from ${socket.remoteAddress}:${socket.remotePort}`);
        this.clients.push(socket);

        socket.on('data', (data: Buffer) => {
            const decodedData = decrypt(data);
            const [command, args] = decodedData.split(' ');

            if (this.adminCommands.includes(command)) {
                this.handleAdminCommand(socket, command, args);
            } else {
                socket.write(encrypt('Invalid command'));
            }
        });

        socket.on('close', () => {
            console.log(`Client ${socket.remoteAddress}:${socket.remotePort} disconnected`);
            const index = this.clients.indexOf(socket);
            if (index !== -1) {
                this.clients.splice(index, 1);
            }
        });
    }

    handleAdminCommand(socket: net.Socket, command: string, args: string): void {
        switch (command) {
            case 'host':
                if (!this.computers.includes(socket)) {
                    this.computers.push(socket);
                    socket.write(encrypt('You are now the host'));
                } else {
                    socket.write(encrypt('You are already the host'));
                }
                break;
            case 'unhost':
                if (this.computers.includes(socket)) {
                    this.computers.splice(this.computers.indexOf(socket), 1);
                    socket.write(encrypt('You are no longer the host'));
                } else {
                    socket.write(encrypt('You are not the host'));
                }
                break;
            case 'list':
                socket.write(encrypt(this.computers.map((c) => `${c.remoteAddress}:${c.remotePort}`).join(' ')));
                break;
            case 'shutdown':
                if (args === 'shutdowncomputerlab') {
                    this.clients.forEach((client) => {
                        client.write(encrypt('shutdown'));
                    });
                } else {
                    socket.write(encrypt('Invalid password'));
                }
                break;
            case 'add_to_grid':
                this.add_to_grid(socket);
                break;
            case 'add_to_network':
                this.add_to_network(socket);
                break;
            case 'set_device_power_state':
                const [deviceIp, powerState] = args.split(' ');
                this.set_device_power_state(powerState, deviceIp);
                break;
        }
    }

    add_to_grid(socket: net.Socket): void {
        this.clients.push(socket);
        this.clients.forEach((client) => {
            client.write(encrypt(`add_client ${socket.remoteAddress}`));
        });
    }

    add_to_network(socket: net.Socket): void {
        const hostIp = this.computers.find((computer) => computer.remoteAddress.startsWith('192.168.'));
        if (hostIp) {
            socket.write(encrypt(`connect_to_host ${hostIp.remoteAddress}`));
        }
    }

    set_device_power_state(powerState: string, deviceIp: string): void {
        const client = this.clients.find((c) => c.remoteAddress === deviceIp);
        if (client) {
            client.write(encrypt(powerState));
        }
    }
}

// Client class
class Client {
    private host: string;
    private port: number;
    private socket: net.Socket;
    private connected: boolean;

    constructor(host: string = '127.0.0.1', port: number = 5000) {
        this.host = host;
        this.port = port;
        this.connected = false;
        this.socket = new net.Socket();
        this.socket.on('connect', () => {
            this.connected = true;
            console.log(`Connected to server on ${this.host}:${this.port}`);
        });
        this.socket.on('error', (err) => {
            console.error(`Failed to connect to server: ${err}`);
        });
    }

    connect(): void {
        this.socket.connect(this.port, this.host);
    }

    send_data(data: string): void {
        if (this.connected) {
            this.socket.write(encrypt(data));
        }
    }

    connect_to_network(serverComputers: net.Socket[]): void {
        if (this.connected) {
            const hostIp = serverComputers.find((computer) => computer.remoteAddress.startsWith('192.168.'));
            if (hostIp) {
                const socket = new net.Socket();
                socket.connect(this.port, hostIp.remoteAddress, () => {
                    console.log(`Connected to server on ${hostIp.remoteAddress}:${this.port}`);
                    this.connected = true;
                    this.socket = socket;
                    this.send_data('add_to_network');
                });
            }
        }
    }

    connect_to_grid(serverComputers: net.Socket[]): void {
        if (this.connected) {
            const hostIp = serverComputers.find((computer) => computer.remoteAddress.startsWith('192.168.'));
            if (hostIp) {
                const socket = new net.Socket();
                socket.connect(this.port, hostIp.remoteAddress, () => {
                    console.log(`Connected to server on ${hostIp.remoteAddress}:${this.port}`);
                    this.connected = true;
                    this.socket = socket;
                    this.send_data('add_to_grid');
                });
            }
        }
    }
}

const server = new Server();
const client = new Client();

// Start server and connect client
server.start();
client.connect();

// Schedule shutdown command after 3 hours and 30 minutes
setTimeout(() => {
    client.send_data('shutdown');
}, 3.5 * 60 * 60 * 1000);

// Continuously adding clients
setInterval(() => {
    const newComputers = Object.keys(psutil.net_if_addrs()).filter((x) => !server.computers.map((c) => c.remoteAddress).includes(x));
    newComputers.forEach((computer) => {
        fs.copyFileSync(__filename, path.join(computer, __filename));
        const newClient = new Client(computer, server.port);
        newClient.connect();
        server.clients.push(newClient);
    });
}, 1000);
