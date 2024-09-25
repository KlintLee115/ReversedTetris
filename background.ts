import { BackgroundGame } from "./backgroundGame"
import { BACKGROUND_PANELS } from "./src/utility/consts"

const background = document.getElementById('background') as HTMLElement
background.style.display = "flex"
background.style.justifyContent = "start"
background.style.alignItems = "start"

background.style.overflow = "hidden"

for (let i = 0; i < BACKGROUND_PANELS; i++) {
    for (let i = 0; i < 1; i++) {
        const section = document.createElement('section')
        new BackgroundGame(section)

        background.appendChild(section)
    }
}