import type { Box } from './models'
import { flatMap, range } from './util'

export type PackingProblem = {
    items: Item[]
}

export type Item = {
    id: number
    possiblePositions: Position[]
}

export type Position = {
    spacesTaken: Set<number>
}

export function make(boxes: Box[], width: number, height: number): PackingProblem {
    return {
        items: boxes.map(box => makeItem(box, width, height))
    }
}

function makeItem(box: Box, width: number, height: number): Item {
    return {
        id: getId(box),
        possiblePositions: allPossibleLocations(box, width, height)
            .map(points => ({spacesTaken: new Set(points.map(point => toNumber(point, width)))}))
    }
}

function toNumber(point: Point, width: number): number {
    return point.y * width + point.x
}

function getId(box: Box): number {
    for (let j = 0; j < box.height; j++) {
        for (let i = 0; i < box.width; i++) {
            if (box.squares[i][j] !== 0) {
                return box.squares[i][j]
            }
        }
    }

    return -1
}

function coordinates(box: Box): Point[] {
    let result: Point[] = []

    for (let j = 0; j < box.height; j++) {
        for (let i = 0; i < box.width; i++) {
            if (box.squares[i][j] !== 0) {
                result.push({x: i, y: j})
            }
        }
    }

    return result
}


type Point = {
    x: number,
    y: number
}


function possibleLocations(box: Box, width: number, height: number):  Point[][] {
    const offsetPoints = coordinates(box)

    let locations: Point[][] = []

    for (let j = 0; j < (height - box.height) + 1; j++) {
        for (let i = 0; i < (width - box.width) + 1; i++) {
            locations.push(offsetPoints.map(({x, y}) => ({x: x + i, y: y + j})))
        }
    }

    return locations
}

function allPossibleLocations(box: Box, width: number, height: number): Point[][] {
    const box90 = rotate(box)
    const box180 = rotate(box90)
    const box270 = rotate(box180)

    return flatMap([box, box90, box180, box270], x => possibleLocations(x, width, height))
}

export function rotate(box: Box): Box {
    let rotatedBox = {
        height: box.width,
        width: box.height,
        squares: range(box.height).map(_ => [])
    }

    for (let j = 0; j < box.height; j++) {
        for (let i = 0; i < box.width; i++) {
            rotatedBox.squares[box.height - j - 1][i] = box.squares[i][j]
        }
    }

    return rotatedBox
}