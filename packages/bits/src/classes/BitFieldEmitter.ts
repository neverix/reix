export type BitFieldEventHandler<T> = (data: T, code: number) => void
export type BitFieldEventHandlerData<T> = {
    code: number
    handler: BitFieldEventHandler<T>
}

/**
 * An event emitter which uses bitFields as event codes,
 * making it easy to call multiple events at a time
 * & set handler for multiple events at once.
 *
 * @param maxBits THe max number of bits to check againts.
 */
export class BitFieldEmitter<T> {
    /**
     * Internal property keeping track of all the event handlers
     */
    private handlers: Set<BitFieldEventHandler<T>>[]

    public constructor(public maxBits = 32) {
        this.handlers = Array(maxBits)
            .fill(1)
            .map(() => new Set<BitFieldEventHandler<T>>())
    }

    /**
     * Adds an event listener. The listener will be called
     * every time an event which overlaps with the passed code
     * for at least 1 bit is fired.
     *
     * @param code The bits to listen for.
     * @param handler The function to call when an event fires.
     *
     * @returns The BitFieldEventHandler instance.
     *
     * @example
     * emitter.on(0b011, something)
     *
     * emitter.emit(0b001, ...) // fired
     * emitter.emit(0b100, ...) // not fired
     * emitter.emit(0b101, ...) // fired
     * emitter.emit(0b110, ...) // fired
     */
    public on(
        code: number,
        handler: BitFieldEventHandler<T>,
        maxBitsHint = this.maxBits
    ) {
        for (let i = 0; i < maxBitsHint; i++) {
            if (code & (1 << i)) {
                this.handlers[i].add(handler)
            }
        }

        return this
    }

    /**
     * Removes a listener.
     *
     * Note: This will remove **All** the listeners for that function.
     *
     * @param handler The event listener to remove.
     *
     * @returns The BitFieldEventHandler instance.
     *
     * @example
     * emitter.on(0, handler)
     * emitter.emit(0, ...) // fires
     *
     * emitter.remove(handler)
     * emitter.emit(0,...) // doesn't fire
     *
     * @example
     * emitter.on(0, handler)
     * emitter.on(1, handler)
     *
     * emitter.remove(handler)
     * emitter.emit(1) // doesn't fire
     */
    public remove(
        handler: BitFieldEventHandler<T>,
        maxBitsHint = this.maxBits
    ) {
        for (let bit = 0; bit < maxBitsHint; bit++) {
            this.handlers[bit].delete(handler)
        }

        return this
    }

    /**
     * Removes all handlers from a set.
     *
     * @param handlers Set with handlers to remove.
     *
     * @returns The BitFieldEventHandler instance.
     *
     * @example
     * const group = new Set([handler1, handler2])
     *
     * emitter.removeGroup(group)
     */
    public removeGroup(
        handlers: Iterable<BitFieldEventHandler<T>>,
        maxBitsHint = this.maxBits
    ) {
        for (let bit = 0; bit < maxBitsHint; bit++) {
            for (const handler of handlers) {
                this.handlers[bit].delete(handler)
            }
        }

        return this
    }

    /**
     * The same as .on but calls .remove after the first trigger
     *
     * @param code The bits to listen for.
     * @param handler The function to call when an event fires.
     *
     * @returns The BitFieldEventHandler instance.
     */
    public once(
        code: number,
        handler: BitFieldEventHandler<T>,
        maxBitsHint = this.maxBits
    ) {
        const onceHandler = (...args: Parameters<BitFieldEventHandler<T>>) => {
            handler(...args)

            this.remove(onceHandler, maxBitsHint)
        }

        this.on(code, onceHandler, maxBitsHint)

        return this
    }

    /**
     * Calls all handlers which have at least 1 bit in common with the passed event code.
     *
     * @param code The code to trigger the listeners with.
     * @param data The data to pass to the listeners.
     *
     * @returns The BitFieldEventHandler instance.
     */
    public emit(code: number, data: T, maxBitsHint = this.maxBits) {
        const called = new Set<BitFieldEventHandler<T>>()

        for (let bit = 0; bit < maxBitsHint; bit++) {
            if (code & (1 << bit)) {
                for (const handler of this.handlers[bit].values()) {
                    if (called.has(handler)) {
                        continue
                    }

                    handler(data, code)
                    called.add(handler)
                }
            }
        }

        return this
    }
}
