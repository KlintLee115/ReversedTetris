# Reversed Tetris

## Overview

Welcome to Reversed Tetris! This is a unique twist on the classic Tetris game where the pieces move upwards instead of downwards.

## Repo Layout
- frontend/
- backend/

## Frontend
### Reversed Tetris

Welcome to Reversed Tetris! This is a unique twist on the classic Tetris game where the pieces move upwards instead of downwards.


### Frontend Table of Contents

- [Features](#frontend-features)
- [Installation](#frontend-installation)
- [Usage](#frontend-usage)
- [Game Modes](#frontend-game-modes)
- [Development](#frontend-development)
- [License](#frontend-license)
- [Article](#frontend-article-link)

### Frontend Features

- **Classic Tetris Gameplay**: Enjoy the classic Tetris gameplay with a twist.
- **Multiplayer Mode**: Play with a friend in real-time using SignalR.
- **Leaderboard**: Track high scores and compete with others.
- **Responsive Design**: Optimized for desktop screens.

### Frontend Installation

To get started, clone the repository and install the dependencies:

```sh
git clone https://github.com/KlintLee115/ReversedTetris.git
cd ReversedTetris/backend
go run main.go

cd ../frontend
npm install
npm run dev
```

Open your browser and navigate to http://localhost:5173.

The frontend defaults to using the same origin for API calls at `/api`, so no `.env` is required for local dev when running the backend on port 8080.

### Frontend Game Modes

#### Solo Mode
In Solo Mode, you can play the game by yourself. The goal is to clear as many rows as possible by moving and rotating the tetromino pieces.

#### Friend Mode
In Friend Mode, you can play with a friend in real-time. One player hosts the game and shares the room ID with the other player. Both players can see each other's game area and compete to clear rows.

### Frontend Development

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

### Frontend Article Link
For more details about the project, you can read the Reversed Tetris article on [Medium](https://medium.com/@klintlee1/reversed-tetris-d1ab447a9779).

## Backend
### Reversed Tetris API

This is the backend API for the Reversed Tetris game, built with Go and WebSocket support.

### Backend Table of Contents

- [Getting Started](#backend-getting-started)
- [Running the Application](#backend-running-the-application)
- [API Endpoints](#backend-api-endpoints)
- [Docker](#backend-docker)
- [Environment Variables](#backend-environment-variables)
- [Contributing](#backend-contributing)
- [License](#backend-license)

### Backend Getting Started

#### Prerequisites

- [Go 1.23+](https://go.dev/dl/)
- [Docker](https://www.docker.com/get-started)

#### Installation

1. Clone the repository:
	```sh
	git clone https://github.com/KlintLee115/ReversedTetris.git
	cd ReversedTetris/backend
	```

2. Restore the dependencies:
	```sh
	go mod download
	```

### Backend Running the Application

#### Using Go

1. Build the project:
	```sh
	go build -o output/reversed_tetris .
	```

2. Run the project:
	```sh
	go run main.go
	```

The API will be available at `http://localhost:8080`.

#### Using Docker

1. Build the Docker image:
	```sh
	docker build -t reversed-tetris-backend -f backend/Dockerfile backend
	```

2. Run the Docker container:
	```sh
	docker run -p 8080:8080 reversed-tetris-backend
	```

The API will be available at `http://localhost:8080`.

### Backend API Endpoints

#### GET /

Returns a simple greeting message.

#### GET /api/roomId

Generates a unique room ID.

#### WebSocket Hub

The WebSocket hub is available at `/api/MessageHub`. It supports the following methods:

- `JoinRoom(string roomId)`: Allows a user to join a specified room. If the room is empty, the user's status is set to `ReadyToBegin`. If another player is already in the room and ready, the game starts.

- `SendMovement(string data)`: Sends the movement data of a player to other players in the same room. The data includes the previous and new coordinates of the player's piece and its color.

- `ClearRows(int[] rows)`: Notifies other players in the same room to clear the specified rows.

- `RequestContinue()`: Requests to continue the game. If all players in the room are ready, the game continues.

- `GameOver()`: Notifies other players in the same room that the game is over and they have won.

- `NotifyPause()`: Pauses the game for all players in the same room.

### Backend Docker

The project includes a Dockerfile for running the application in a Docker container.

### Backend Environment Variables

The application can use environment variables defined in a `.env` file or injected directly via the runtime environment.

### Backend Contributing

Contributions are welcome! Please open an issue or submit a pull request.

### Backend License

This project is licensed under the MIT License.

## License
See the Frontend and Backend sections for license information.