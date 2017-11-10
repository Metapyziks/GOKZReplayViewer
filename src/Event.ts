namespace Gokz {
    export type Handler<TEventArgs, TSender> = (args: TEventArgs, sender: TSender) => void;
    export class Event<TEventArgs, TSender> {
        private readonly sender: TSender;
        private handlers: Handler<TEventArgs, TSender>[] = [];

        constructor(sender: TSender) {
            this.sender = sender;
        }

        addListener(handler: Handler<TEventArgs, TSender>): void {
            this.handlers.push(handler);
        }

        removeListener(handler: Handler<TEventArgs, TSender>): boolean {
            const index = this.handlers.indexOf(handler);
            if (index === -1) return false;

            this.handlers.splice(index, 1);
            return true;
        }

        clearListeners(): void {
            this.handlers = [];
        }

        dispatch(args: TEventArgs): void {
            const count = this.handlers.length;
            for (let i = 0; i < count; ++i) {
                this.handlers[i](args, this.sender);
            }
        }
    }

    export class ChangedEvent<TValue, TEventArgs, TSender> extends Event<TEventArgs, TSender> {
        private prevValue: TValue;
        private equalityComparison: (a: TValue, b: TValue) => boolean;

        constructor(sender: TSender, equalityComparison?: (a: TValue, b: TValue) => boolean) {
            super(sender);

            if (equalityComparison != null) {
                this.equalityComparison = equalityComparison;
            } else {
                this.equalityComparison = (a, b) => a === b;
            }
        }

        reset(): void {
            this.prevValue = undefined;
        }

        update(value: TValue, args?: TEventArgs): void {
            if (this.equalityComparison(this.prevValue, value)) return;
            this.prevValue = value;
            this.dispatch(args === undefined ? value as any : args);
        }
    }
}