import { Game } from "./src/game"

const mainArea = document.getElementsByTagName('main').item(0)!;
const pauseScreen = document.getElementById('pauseScreen')!;
const continueButton = document.getElementById('continueButton')!;
const waitingForFriendStatus = document.getElementById('waiting-for-friend-status')!;
const waitingForFriendCountdown = document.getElementById('waiting-for-friend-countdown')!;

const game = new Game(mainArea, pauseScreen, continueButton, waitingForFriendStatus, waitingForFriendCountdown)