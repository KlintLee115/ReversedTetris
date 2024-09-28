import { HomeBackgroundConfig } from "../core/BackgroundGameConfig"
import { BACKGROUND_PANELS } from "../utils/consts"

const background = document.getElementById('background') as HTMLElement
background.style.display = "flex"
background.style.justifyContent = "start"
background.style.alignItems = "start"

background.style.overflow = "hidden"

for (let i = 0; i < BACKGROUND_PANELS; i++) {
    const section = document.createElement('section')
    new HomeBackgroundConfig(section)

    background.appendChild(section)
}