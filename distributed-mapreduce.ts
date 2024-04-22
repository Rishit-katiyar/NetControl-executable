// Import necessary modules
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';
import * as cluster from 'cluster';
import * as readline from 'readline';

// Define types
type MapFunction<T> = (data: T) => [string, number][];
type ReduceFunction = (key: string, values: number[]) => number;

// Define a class for the master node
class MasterNode<T> {
    private inputFilePath: string;
    private mapFunction: MapFunction<T>;
    private reduceFunction: ReduceFunction;
    private numWorkers: number;
    private results: Map<string, number[]>;
    private taskQueue: T[];
    private currentTaskIndex: number;
    private workers: cluster.Worker[];
    private activeTasks: Map<number, cluster.Worker>;

    constructor(inputFilePath: string, mapFunction: MapFunction<T>, reduceFunction: ReduceFunction, numWorkers: number) {
        this.inputFilePath = inputFilePath;
        this.mapFunction = mapFunction;
        this.reduceFunction = reduceFunction;
        this.numWorkers = numWorkers;
        this.results = new Map();
        this.taskQueue = [];
        this.currentTaskIndex = 0;
        this.workers = [];
        this.activeTasks = new Map();
    }

    async run(): Promise<void> {
        // Read input file and populate task queue
        await this.populateTaskQueue();

        // Fork worker processes
        await this.forkWorkers();

        // Start distributing tasks
        this.distributeTasks();
    }

    private async populateTaskQueue(): Promise<void> {
        const fileStream = fs.createReadStream(this.inputFilePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            this.taskQueue.push(line as unknown as T);
        }
    }

    private async forkWorkers(): Promise<void> {
        for (let i = 0; i < this.numWorkers; i++) {
            const worker = cluster.fork();
            this.workers.push(worker);

            worker.on('message', (message: { type: string, data: any }) => {
                if (message.type === 'result') {
                    for (const [key, value] of message.data) {
                        if (!this.results.has(key)) {
                            this.results.set(key, []);
                        }
                        this.results.get(key)?.push(value);
                    }
                } else if (message.type === 'ready') {
                    this.activeTasks.delete(message.workerId);
                    this.distributeTasks();
                }
            });
        }
    }

    private distributeTasks(): void {
        while (this.currentTaskIndex < this.taskQueue.length && this.activeTasks.size < this.numWorkers) {
            const task = this.taskQueue[this.currentTaskIndex];
            const worker = this.getAvailableWorker();
            if (worker) {
                worker.send({ type: 'task', data: task });
                this.activeTasks.set(worker.id, worker);
                this.currentTaskIndex++;
            } else {
                break;
            }
        }

        if (this.currentTaskIndex === this.taskQueue.length && this.activeTasks.size === 0) {
            this.aggregateResults();
        }
    }

    private getAvailableWorker(): cluster.Worker | undefined {
        for (const worker of this.workers) {
            if (!this.activeTasks.has(worker.id)) {
                return worker;
            }
        }
        return undefined;
    }

    private aggregateResults(): void {
        const finalResult = new Map<string, number>();
        for (const [key, values] of this.results) {
            finalResult.set(key, this.reduceFunction(key, values));
        }

        console.log('Final Result:');
        console.log(finalResult);
    }
}

// Define a class for the worker node
class WorkerNode<T> {
    private mapFunction: MapFunction<T>;

    constructor(mapFunction: MapFunction<T>) {
        this.mapFunction = mapFunction;
    }

    run(): void {
        process.on('message', (message: { type: string, data: any }) => {
            if (message.type === 'task') {
                const result = this.mapFunction(message.data);
                process.send({ type: 'result', data: result });
                process.send({ type: 'ready', workerId: process.pid });
            }
        });
    }
}

// Define sample map and reduce functions
const mapFunction: MapFunction<string> = (data: string) => {
    const words = data.split(/\s+/);
    const wordCounts = new Map<string, number>();
    for (const word of words) {
        const normalizedWord = word.toLowerCase();
        if (!wordCounts.has(normalizedWord)) {
            wordCounts.set(normalizedWord, 0);
        }
        wordCounts.set(normalizedWord, wordCounts.get(normalizedWord)! + 1);
    }
    return Array.from(wordCounts.entries());
};

const reduceFunction: ReduceFunction = (key: string, values: number[]) => {
    return values.reduce((acc, curr) => acc + curr, 0);
};

// Main function
async function main() {
    if (cluster.isMaster) {
        // Create master node
        const inputFilePath = path.join(__dirname, 'data.txt');
        const masterNode = new MasterNode<string>(inputFilePath, mapFunction, reduceFunction, os.cpus().length);
        await masterNode.run();
    } else {
        // Create worker node
        const workerNode = new WorkerNode<string>(mapFunction);
        workerNode.run();
    }
}

// Run main function
main().catch((error) => {
    console.error('An error occurred:', error);
    process.exit(1);
});
