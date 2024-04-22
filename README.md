# 🌐 NetControl-executable: A Powerful Network Control System 🚀

Welcome to NetControl-executable! This repository houses a robust TypeScript-based client-server network control system, designed to empower you with remote management capabilities for networked devices. From executing commands to managing connections, NetControl-executable offers a comprehensive suite of features to streamline your network operations.

## 🛠️ Getting Started

### Prerequisites
Before diving into NetControl-executable, ensure you have the following prerequisites installed:

- **Node.js**: Ensure you have Node.js installed on your system. You can download it from [here](https://nodejs.org/).
- **npm**: npm, the Node.js package manager, is required to install dependencies. It usually comes bundled with Node.js.

### Installation
Follow these simple steps to install NetControl-executable:

1. **Clone the Repository**: Clone this repository to your local machine using Git:

    ```bash
    git clone https://github.com/Rishit-katiyar/NetControl-executable.git
    ```

2. **Navigate to the Directory**: Move into the repository directory:

    ```bash
    cd NetControl-executable
    ```

3. **Install Dependencies**: Use npm to install the necessary dependencies:

    ```bash
    npm install
    ```

## 🚀 Usage

### Starting the Server
To kickstart the server, execute the following command:

```bash
npm start
```

By default, the server will be hosted on `0.0.0.0:5000`. If you wish to specify a custom host and port, set the environment variables `HOST` and `PORT` before running the command.

### Connecting a Client
Connecting a client to the server is straightforward. Simply download the appropriate client executable from the [releases page](https://github.com/Rishit-katiyar/NetControl-executable/releases) based on your operating system.

Once downloaded, run the client executable to establish a connection with the server. Depending on your client configuration, you may need to provide the server's host and port as command-line arguments.

### Executing Commands
Once connected, you can wield the power of NetControl-executable to execute various commands remotely. Here's a sneak peek at some of the available commands:

- `host`: Ascend your client to the esteemed position of the host server.
- `unhost`: Relinquish your client's host status.
- `list`: Obtain a comprehensive list of all connected clients.
- `shutdown`: Initiate the graceful shutdown of connected clients (password required).
- `add_to_grid`: Integrate your client seamlessly into the grid.
- `add_to_network`: Forge new connections by adding your client to the network.
- `set_device_power_state`: Take charge of device power states with surgical precision.

For detailed usage instructions for each command, refer to the documentation or invoke the `help` command from your client.

## 📝 License
NetControl-executable operates under the [MIT License](LICENSE), granting you the freedom to utilize, modify, and distribute the code as per the terms of the license.
