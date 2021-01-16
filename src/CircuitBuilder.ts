import type { Circuit } from './Circuit'

export function and(a: Circuit | string, b: Circuit | string): Circuit {
    return {
        kind: 'And',
        left: (typeof a === 'string') ? Variable(a) : a,
        right: (typeof b === 'string') ? Variable(b) : b
    }
}

export function or(a: Circuit | string, b: Circuit | string): Circuit {
    return {
        kind: 'Or',
        left: (typeof a === 'string') ? Variable(a) : a,
        right: (typeof b === 'string') ? Variable(b) : b
    }
}

export function xor(a: Circuit | string, b: Circuit | string): Circuit {
    return {
        kind: 'Xor',
        left: asCircuit(a),
        right: asCircuit(b)
    }
}

export function not(a: Circuit | string): Circuit {
    return {
        kind: 'Not',
        value: (typeof a === 'string') ? Variable(a) : a
    }
}

export function Variable(name: string): Circuit {
    return {kind: 'Variable', name}
}

export function exactlyOne(first: string | Circuit, ...rest: (string | Circuit)[]): Circuit {
    if (rest.length === 0) {
        return asCircuit(first)
    }

    const [restFirst, ...restRest] = rest


    return xor(first, exactlyOne(restFirst, ...restRest))
}

export function none(first: string | Circuit, ...rest: (string | Circuit)[]): Circuit {
    if (rest.length === 0) {
        return not(first)
    }

    const [restFirst, ...restRest] = rest

    return and(not(first), none(restFirst, ...restRest))
}

export function atLeastOne(first: Circuit | string, ...rest: (Circuit | string)[]): Circuit {
    if (rest.length === 0) {
        return asCircuit(first)
    }

    const [restFirst, ...restRest] = rest

    return or(first, atLeastOne(restFirst, ...restRest))
}

export function all(first: Circuit | string, ...rest: (Circuit | string)[]): Circuit {
    if (rest.length === 0) {
        return asCircuit(first)
    }

    const [restFirst, ...restRest] = rest

    return and(
        first,
        all(restFirst, ...restRest)
    )
}

function asCircuit(x: string | Circuit): Circuit {
    return typeof x === 'string' ? Variable(x) : x
}

function asCircuits(xs: (string | Circuit)[]): Circuit[] {
    return xs.map(asCircuit)
}

function satisfiable(): Circuit {
    return or('SAT', not('SAT'))
}

function unsatisfiable(): Circuit {
    return and('UNSAT', not('UNSAT'))
}