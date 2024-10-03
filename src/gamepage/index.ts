import { Game } from "../core/GamePlayConfig"

const mainArea = document.getElementsByTagName('main').item(0)!;
const pauseScreen = document.getElementById('pauseScreen')!;
const continueButton = document.getElementById('continueButton')!;
const textStatus = document.getElementById('textStatus')!

new Game(mainArea, pauseScreen, continueButton, textStatus)