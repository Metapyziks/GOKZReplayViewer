namespace Gokz {
    export class OptionsMenu {
        private readonly viewer: ReplayViewer;

        readonly element: HTMLElement;
        readonly titleElem: HTMLSpanElement;
        readonly optionContainer: HTMLElement;

        constructor(viewer: ReplayViewer, container?: HTMLElement) {
            this.viewer = viewer;

            if (container === undefined) {
                container = this.viewer.container;
            }

            const element = this.element = document.createElement("div");
            element.classList.add("options-menu");
            element.innerHTML = `<div class="options-title"></div><div class="options-list"></div>`;

            container.appendChild(element);

            this.titleElem = element.getElementsByClassName("options-title")[0] as HTMLSpanElement;
            this.optionContainer = element.getElementsByClassName("options-list")[0] as HTMLElement;

            viewer.showOptionsChanged.addListener(showOptions => {
                if (showOptions) this.show();
                else this.hide();
            });
        }

        show(): void {
            this.element.style.display = "block";
            this.showMainPage();

            if (this.viewer.controls != null) {
                this.viewer.controls.hideSpeedControl();
            }
        }

        hide(): void {
            this.element.style.display = "none";
            this.clear();
        }

        private clear(): void {
            this.optionContainer.innerHTML = "";
        }

        private showMainPage(): void {
            const viewer = this.viewer;

            this.clear();
            this.setTitle("Options");
            this.addToggleOption("Show Crosshair",
                () => viewer.showCrosshair,
                value => viewer.showCrosshair = value,
                viewer.showCrosshairChanged);
            this.addToggleOption("Show Framerate",
                () => viewer.showDebugPanel,
                value => viewer.showDebugPanel = value);
            this.addToggleOption("Show Key Presses",
                () => viewer.showKeyDisplay,
                value => viewer.showKeyDisplay = value,
                viewer.showKeyDisplayChanged);
            this.addToggleOption("Free Camera",
                () => viewer.cameraMode === SourceUtils.CameraMode.FreeCam,
                value => viewer.cameraMode = value
                    ? SourceUtils.CameraMode.FreeCam
                    : SourceUtils.CameraMode.Fixed,
                viewer.cameraModeChanged);
        }

        private setTitle(title: string): void {
            this.titleElem.innerText = title;
        }

        private addToggleOption<TArgs, TSender>(label: string, getter: () => boolean, setter: (value: boolean) => void, changed?: Event<TArgs, TSender>): void {
            const option = document.createElement("div");
            option.classList.add("option");
            option.innerHTML = `${label}<div class="toggle"><div class="knob"></div></div>`;

            this.optionContainer.appendChild(option);

            const toggle = option.getElementsByClassName("toggle")[0] as HTMLElement;

            const updateOption = () => {
                if (getter()) {
                    toggle.classList.add("on");
                } else {
                    toggle.classList.remove("on");
                }
            };

            option.addEventListener("click", ev => {
                setter(!getter());
                
                if (changed == null){
                    updateOption();
                }
            });

            if (changed != null) {
                changed.addListener(() => updateOption());
            }

            updateOption();
        }
    }
}