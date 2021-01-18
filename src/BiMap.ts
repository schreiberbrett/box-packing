export class BiMap<A, B> {
    private aToBs: Map<A, Set<B>>
    private bToAs: Map<B, Set<A>>

    constructor(pairs: [A, B][]) {
        this.aToBs = new Map()
        this.bToAs = new Map()

        for (let [a, b] of pairs) {
            if (!this.aToBs.has(a)) {
                this.aToBs.set(a, new Set())
            }

            const bSet = this.aToBs.get(a)
            bSet.add(b)

            if (!this.bToAs.has(b)) {
                this.bToAs.set(b, new Set())
            }

            const aSet = this.bToAs.get(b)
            aSet.add(a)
        }
    }

    public has(a: A, b: B): boolean {
        return this.aToBs.get(a).has(b)
    }

    public getRights(a: A): B[] {
        return [...this.aToBs.get(a).values()]
    }

    public getLefts(b: B): A[] {
        return [...this.bToAs.get(b).values()]
    }
}