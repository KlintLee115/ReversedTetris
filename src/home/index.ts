import { API_URL } from "../utility/consts"

const soloButton = document.getElementById('solo-button') as HTMLButtonElement
const friendButton = document.getElementById('friend-button') as HTMLButtonElement
const enteredRoomId = document.getElementById('enteredRoomId') as HTMLInputElement

const joinGeneratedRoomButton = document.getElementById('joinGeneratedRoomButton') as HTMLButtonElement
const generatedRoomId = document.getElementById('generatedRoomId') as HTMLButtonElement
const joinEnteredRoomIdButton = document.getElementById('joinEnteredRoomIdButton') as HTMLButtonElement
const generateRoomIdButton = document.getElementById('generateRoomIdButton') as HTMLButtonElement

const friendSection = document.getElementById('friend-section') as HTMLElement

soloButton.addEventListener('click', () => window.location.href = "../game.html")
friendButton.addEventListener('click', () => {
    friendSection.style.display = "block"
})

enteredRoomId.addEventListener('input', (event: Event) => {
    const input = event.target as HTMLInputElement;

    const roomId = input.value

    joinEnteredRoomIdButton.disabled = roomId.length === 0
})

joinEnteredRoomIdButton.addEventListener('click', () => {

    const roomId = enteredRoomId.value

    window.location.href = `game.html?id=${roomId}`
})

generateRoomIdButton.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/roomId`) as Response
        const roomId = await response.text()

        generatedRoomId.innerHTML = `Room ID: ${roomId}`
        joinGeneratedRoomButton.style.display = "block"

        joinGeneratedRoomButton.addEventListener('click', () => {
            window.location.href = `game.html?id=${roomId}`
        })

    }

    catch (err) {
        alert(err)
    }
})