class KeyDisplay {
    private readonly element: HTMLElement;
    private readonly buttonMap: {[button: number]: HTMLElement} = {};

    constructor(container: HTMLElement) {
        this.element = document.createElement("div");
        this.element.classList.add("key-display");
        this.element.innerHTML = `
            <div class="key key-w">W</div>
            <div class="key key-a">A</div>
            <div class="key key-s">S</div>
            <div class="key key-d">D</div>
            <div class="key key-walk">Walk</div>
            <div class="key key-duck">Duck</div>
            <div class="key key-jump">Jump</div>`;

        container.appendChild(this.element);

        this.buttonMap[Button.Forward] = this.element.getElementsByClassName("key-w")[0] as HTMLElement;
        this.buttonMap[Button.MoveLeft] = this.element.getElementsByClassName("key-a")[0] as HTMLElement;
        this.buttonMap[Button.Back] = this.element.getElementsByClassName("key-s")[0] as HTMLElement;
        this.buttonMap[Button.MoveRight] = this.element.getElementsByClassName("key-d")[0] as HTMLElement;
        this.buttonMap[Button.Walk] = this.element.getElementsByClassName("key-walk")[0] as HTMLElement;
        this.buttonMap[Button.Duck] = this.element.getElementsByClassName("key-duck")[0] as HTMLElement;
        this.buttonMap[Button.Jump] = this.element.getElementsByClassName("key-jump")[0] as HTMLElement;
    }

    update(keys: Button): void {
        for (let key in this.buttonMap) {
            const pressed = (keys & (parseInt(key) as Button)) !== 0;

            if (pressed) {
                this.buttonMap[key].classList.add("pressed");
            } else {
                this.buttonMap[key].classList.remove("pressed");
            }
        }
    }

    show(): void {
        this.element.style.display = "block";
    }

    hide(): void {
        this.element.style.display = "none";
    }
}
