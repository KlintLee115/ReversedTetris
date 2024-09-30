import { Game } from "../core/GamePlayConfig"

const mainArea = document.getElementsByTagName('main').item(0)!;
const pauseScreen = document.getElementById('pauseScreen')!;
const continueButton = document.getElementById('continueButton')!;
const waitingForFriendStatus = document.getElementById('waiting-for-friend-status')!;
const waitingForFriendCountdown = document.getElementById('waiting-for-friend-countdown')!;

const bgMusic1 = document.getElementById('backgroundMusic1') as HTMLAudioElement
const bgMusic2 = document.getElementById('backgroundMusic2') as HTMLAudioElement

bgMusic1.addEventListener('ended', () => bgMusic2.play())
bgMusic2.addEventListener('ended', () => bgMusic1.play())

window.addEventListener('load', () => bgMusic1.play());

new Game(mainArea, pauseScreen, continueButton, waitingForFriendStatus, waitingForFriendCountdown)