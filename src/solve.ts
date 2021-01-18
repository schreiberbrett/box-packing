import type { Box } from './models'
import type { PackingProblem, Item } from './PackingProblem'
import { Just, Maybe, Nothing, range } from './util'

export function solve(problem: PackingProblem): Maybe<ItemIdAndPosition[]> {
    return helper(problem, [])

    function helper(problem: PackingProblem, currentAssignments: ItemIdAndPosition[]): Maybe<ItemIdAndPosition[]> {
        const result = search(problem)

        switch (result.kind) {
            case 'No More Items':
                return Just(currentAssignments)

            case 'No Possible Positions For An Item':
                return Nothing()

            case 'Exactly One Position':
                return helper(
                    withItemInPosition(problem, result.position),
                    [...currentAssignments, result.position]
                )

            case 'Need To Try All Positions':
                for (let position of result.item.possiblePositions) {
                    const namedPosition: ItemIdAndPosition = {
                        id: result.item.id, spacesTaken: position.spacesTaken
                    }
                    const maybePositions = helper(
                        withItemInPosition(problem, namedPosition),
                        [...currentAssignments, namedPosition]
                    )

                    if (maybePositions.kind === 'Just') {
                        return maybePositions
                    }
                }

                return Nothing()
        }
    }
}

function withItemInPosition(problem: PackingProblem, position: ItemIdAndPosition): PackingProblem {
    return removeSpaces(
        { items: problem.items.filter(item => item.id !== position.id) },
        [...position.spacesTaken.values()]
    )
}

function removeSpaces(problem: PackingProblem, spaces: number[]): PackingProblem {
    return {
        items: problem.items.map(item => ({
            id: item.id,
            possiblePositions: item.possiblePositions.filter(position => !spaces.some(space => position.spacesTaken.has(space)))
        }))
    }
}


type Result = {
    kind: 'No More Items' | 'No Possible Positions For An Item'
} | {
    kind: 'Exactly One Position'
    position: ItemIdAndPosition
} | {
    kind: 'Need To Try All Positions'
    item: Item
}


function search(problem: PackingProblem): Result {
    if (problem.items.length === 0) {
        return {kind: 'No More Items'}
    }

    for (let item of problem.items) {
        if (item.possiblePositions.length === 0) {
            return {kind: 'No Possible Positions For An Item'}
        }

        if (item.possiblePositions.length === 1) {
            return {kind: 'Exactly One Position', position: {id: item.id, spacesTaken: item.possiblePositions[0].spacesTaken}}
        }
    }

    return {kind: 'Need To Try All Positions', item: problem.items[0]}
}

export type ItemIdAndPosition = {
    id: number,
    spacesTaken: Set<number>
}

export function toBox(positions: ItemIdAndPosition[], width: number, height: number): Box {
    let squares = range(width).map(i => range(height).map(j => 0))

    for (let position of positions) {
        for (let space of position.spacesTaken.values()) {
            const {x, y} = fromNumber(space, width)

            squares[x][y] = position.id
        }
    }

    return {
        width,
        height,
        squares
    }
}

function fromNumber(n: number, width: number): Point {
    return {
        x: n % width,
        y: Math.floor(n / width)
    }
}

type Point = {
    x: number,
    y: number
}