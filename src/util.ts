export type Maybe<T> = {
    kind: 'Nothing'
} | {
    kind: 'Just'
    value: T
}

export function Nothing<T>(): Maybe<T> {
    return {kind: 'Nothing'}
}

export function Just<T>(value: T): Maybe<T> {
    return {kind: 'Just', value}
}

export function map<A, B>(maybe: Maybe<A>, f: (a: A) => B): Maybe<B> {
    if (maybe.kind === 'Nothing') {
        return Nothing()
    }

    return Just(f(maybe.value))
}

export function justs<T>(xs: Maybe<T>[]): T[] {
    let result: T[] = []
    for (let x of xs) {
        if (x.kind === 'Just') {
            result.push(x.value)
        }
    }

    return result
}

export class BiMap<L, R> {
    private leftToRight: Map<L, R>
    private rightToLeft: Map<R, L>

    constructor() {
        this.leftToRight = new Map()
        this.rightToLeft = new Map()
    }

    set(left: L, right: R): void {
        this.leftToRight.set(left, right)
        this.rightToLeft.set(right, left)
    }

    getRight(left: L): R {
        return this.leftToRight.get(left)
    }

    getLeft(right: R): L {
        return this.rightToLeft.get(right)
    }

    hasLeft(left: L): boolean {
        return this.leftToRight.has(left)
    }

    hasRight(right: R): boolean {
        return this.rightToLeft.has(right)
    }
}

export type Either<L, R> = {
    kind: 'Left',
    value: L
} | {
    kind: 'Right'
    value: R
}

export function Left<L, R>(value: L): Either<L, R> {
    return {kind: 'Left', value}
}


export function Right<L, R>(value: R): Either<L, R> {
    return {kind: 'Right', value}
}

export function range(n: number): number[] {
	let result: number[] = []

	for (let i = 0; i < n; i++) {
		result.push(i)
	}

	return result
}

export function flatMap<A, B>(as: A[], f: (a: A) => B[]): B[] {
    let result: B[] = []
    for (let a of as) {
        result.push(...f(a))
    }

    return result
}

export function sumBy<T>(xs: T[], f: (x: T) => number): number {
    let result = 0
    for (let x of xs) {
        result += f(x)
    }

    return result
}