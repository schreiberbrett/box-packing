import { BiMap, Maybe, Nothing, Just, flatMap } from './util'

export type Circuit = {
    kind: 'And' | 'Or' | 'Xor'
    left: Circuit
    right: Circuit
} | {
    kind: 'Not'
    value: Circuit
} | {
    kind: 'Variable'
    name: string
}

export function satisfy(circuit: Circuit): Maybe<Map<string, boolean>> {
    const {lookup, assignments} = tseitinTransform(circuit)

    const cnf = toCNF(assignments)
    const maybe = cnfSatisfy(cnf)
    if (maybe.kind === 'Nothing') {
        return Nothing()
    }

    let map = new Map<string, boolean>()
    for (let number of maybe.value) {
        if (lookup.hasRight(Math.abs(number))) {
            map.set(lookup.getLeft(Math.abs(number)), number > 0)
        }
    }


    return Just(map)
}

type TseitinAssignment = {
    kind: 'And' | 'Or' | 'Xor'
    lhs: number
    rhs1: number
    rhs2: number
} | {
    kind: 'Not'
    lhs: number
    rhs: number
}

type Node = {
    kind: 'And' | 'Or' | 'Xor' | 'Not'
} | {
    kind: 'Variable'
    name: string
}

function tseitinTransform(circuit: Circuit): {lookup: BiMap<string, number>, assignments: TseitinAssignment[]} {
    const traversal = postorderTraversal(circuit)
    return reconstruct(traversal)
}

function postorderTraversal(circuit: Circuit): Node[] {
    switch (circuit.kind) {
        case 'And':
            return [
                ...postorderTraversal(circuit.left),
                ...postorderTraversal(circuit.right),
                {kind: 'And'}
            ]

        case 'Or':
            return [
                ...postorderTraversal(circuit.left),
                ...postorderTraversal(circuit.right),
                {kind: 'Or'}
            ]

        case 'Xor':
            return [
                ...postorderTraversal(circuit.left),
                ...postorderTraversal(circuit.right),
                {kind: 'Xor'}
            ]

        case 'Not':
            return [
                ...postorderTraversal(circuit.value),
                {kind: 'Not'}
            ]

        case 'Variable':
            return [
                {kind: 'Variable', name: circuit.name}
            ]
    }
}

function reconstruct(traversal: Node[]): {lookup: BiMap<string, number>, assignments: TseitinAssignment[]} {
    let i = 1
    let lookup = new BiMap<string, number>()
    let stack: number[] = []
    let assignments: TseitinAssignment[] = []


    for (let node of traversal) {
        switch (node.kind) {
            case 'Variable':
                if (!lookup.hasLeft(node.name)) {
                    lookup.set(node.name, i)
                    i++
                }

                stack.push(lookup.getRight(node.name))
                break

            case 'And':
                const andRight = stack.pop()
                const andLeft = stack.pop()
                assignments.push({kind: 'And', lhs: i, rhs1: andLeft, rhs2: andRight})
                stack.push(i)
                i++
                break

            case 'Or':
                const orRight = stack.pop()
                const orLeft = stack.pop()
                assignments.push({kind: 'Or', lhs: i, rhs1: orLeft, rhs2: orRight})
                stack.push(i)
                i++
                break

            case 'Xor':
                const xorRight = stack.pop()
                const xorLeft = stack.pop()
                assignments.push({kind: 'Xor', lhs: i, rhs1: xorLeft, rhs2: xorRight})
                stack.push(i)
                i++
                break
        
            case 'Not':
                const value = stack.pop()
                assignments.push({kind: 'Not', lhs: i, rhs: value})
                stack.push(i)
                i++
                break
        }
    }

    return {lookup, assignments}
}

function toCNF(assignments: TseitinAssignment[]): number[][] {
    return ([[assignments[assignments.length - 1].lhs]]).concat(flatMap(assignments, assignment => {
        let a: number
        let b: number
        let c: number
    
        switch (assignment.kind) {
            case 'And':
                c = assignment.lhs
                a = assignment.rhs1
                b = assignment.rhs2
                return [
                    [-a, -b, c],
                    [a, -c],
                    [b, -c]
                ]
    
            case 'Or':
                c = assignment.lhs
                a = assignment.rhs1
                b = assignment.rhs2
                return [
                    [a, b, -c],
                    [-a, c],
                    [-b, c]
                ]

            case 'Xor':
                c = assignment.lhs
                a = assignment.rhs1
                b = assignment.rhs2
                return [
                    [-a, -b, -c],
                    [a, b, -c],
                    [a, -b, c],
                    [-a, b, c]
                ]
    
            case 'Not':
                c = assignment.lhs
                a = assignment.rhs
                return [
                    [-a, -c],
                    [a, c]
                ]
        }
    }))
}

type SearchResult = {
    kind: 'Empty Clause' | 'Empty Formula'
} | {
    kind: 'Unit' | 'Arbitrary Choice'
    literal: number
}

function search(cnf: number[][]): SearchResult {
    if (cnf.length === 0) {
        return {kind: 'Empty Formula'}
    }

    for (let disjunction of cnf) {
        if (disjunction.length === 0) {
            return {kind: 'Empty Clause'}
        }

        if (disjunction.length === 1) {
            return {kind: 'Unit', literal: disjunction[0]}
        }
    }

    return {kind: 'Arbitrary Choice', literal: cnf[0][0]}
}

function cnfSatisfy(cnf: number[][]): Maybe<number[]> {
    return helper(cnf, [])

    function helper(cnf: number[][], currentAssignments: number[]): Maybe<number[]> {
        const result = search(cnf)

        switch (result.kind) {
            case 'Empty Formula':
                return Just(currentAssignments)

            case 'Empty Clause':
                return Nothing()
    
            case 'Unit':
                return helper(unitPropogate(cnf, result.literal), [...currentAssignments, result.literal])

            case 'Arbitrary Choice':
				const firstTry = helper(unitPropogate(cnf, result.literal), [...currentAssignments, result.literal])
				if (firstTry.kind === 'Just') {
					return firstTry
				}
				const secondTry = helper(unitPropogate(cnf, -result.literal), [...currentAssignments, -result.literal])
				if (secondTry.kind === 'Just') {
					return secondTry
				}

				return Nothing()
        }
    }
}

function unitPropogate(cnf: number[][], unit: number): number[][] {
    return cnf
        .map(disjunction => disjunction.filter(literal => literal !== -unit))
        .filter(disjunction => !disjunction.includes(unit))
}
