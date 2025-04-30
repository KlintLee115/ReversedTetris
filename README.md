# Reversed Tetris

Welcome to Reversed Tetris! This is a unique twist on the classic Tetris game where the pieces move upwards instead of downwards.


## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Game Modes](#game-modes)
- [Development](#development)
- [License](#license)
- [Article](#article-link)

## Features

- **Classic Tetris Gameplay**: Enjoy the classic Tetris gameplay with a twist.
- **Multiplayer Mode**: Play with a friend in real-time using SignalR.
- **Leaderboard**: Track high scores and compete with others.
- **Responsive Design**: Optimized for desktop screens.

## Installation

To get started, clone the repository and install the dependencies:

```sh
git clone https://github.com/yourusername/reversed-tetris.git
cd reversed-tetris
npm install
```

## Usage
To run the game locally, use the following command:

```sh
npm run dev
```

This will start the Vite development server. Open your browser and navigate to http://localhost:3000.

## Game Modes

### Solo Mode
In Solo Mode, you can play the game by yourself. The goal is to clear as many rows as possible by moving and rotating the tetromino pieces.

### Friend Mode
In Friend Mode, you can play with a friend in real-time. One player hosts the game and shares the room ID with the other player. Both players can see each other's game area and compete to clear rows.

### Development

#### Project Structure

- **src/**: Contains the source code.
  - **core/**: Core game logic and configurations.
  - **Services/**: Services for handling SignalR connections, UI updates, and leaderboard management.
  - **home/**: Home page scripts.
  - **gamepage/**: Game page scripts.
- **public/**: Static assets.
- **.github/**: GitHub workflows for CI/CD.
- **Dockerfile**: Docker configuration for containerized deployment.
- **index.html**: Main entry point for the home page.
- **game.html**: Main entry point for the game page.
- **style.css**: Global styles.

#### SignalR Integration
The game uses SignalR for real-time communication between players. The SignalR connection is managed in `src/Services/signalR/signalR.ts`.

#### Building the Project
To build the project for production, run:
`npm run build`

This will compile the TypeScript code and bundle the assets using Vite.

#### Docker Deployment
To deploy the game using Docker, use the provided Dockerfile. Build and run the Docker image with the following commands:

```sh
docker build -t reversed-tetris .
docker run -p 3000:3000 reversed-tetris
```

### Article
For more details about the project, you can read the Reversed Tetris article on [Medium](https://medium.com/@klintlee1/reversed-tetris-d1ab447a9779).
