import { Circuit, satisfy } from "./Circuit"
import { all, and, exactlyOne, xor } from "./CircuitBuilder"
import { flatMap, Just, justs, Maybe, Nothing, range } from "./util"

export type Box = {
    width: number
    height: number
    squares: number[][]
}

export function empty(): Box {
    return {
        height: 0,
        width: 0,
        squares: []
    }
}

export function computeSquareStyle(box: Box, i: number, j: number): string {
    return [
        `background-color: ${box.squares[i][j] === 0 ? 'white' : lookupColor(box.squares[i][j])};`,
        `border-top: ${(j === 0 || box.squares[i][j] !== box.squares[i][j - 1]) ? 3 : 0}px solid black;`,
        `border-bottom: ${j === box.height - 1 || box.squares[i][j] !== box.squares[i][j + 1] ? 3 : 0 }px solid black;`,
        `border-left: ${(i === 0 || box.squares[i][j] !== box.squares[i - 1][j]) ? 3 : 0 }px solid black;`,
        `border-right: ${(i === box.width - 1 || box.squares[i][j] !== box.squares[i + 1][j]) ? 3 : 0 }px solid black;`
    ].join('')
}

function lookupColor(id: number): string {
    const colors = [
        'pink',
        'lightgreen',
        'lightblue',
        'yellow',
        'orange',
        'purple',
        'goldenrod'
    ]

    return colors[id % colors.length]
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

function boxInOneSpot(box: Box, width: number, height: number): Circuit {
    const id = getId(box)

    const box90 = rotate(box)
    const box180 = rotate(box90)
    const box270 = rotate(box180)

    const locations = possibleLocations(box, width, height)
    const locations90 = possibleLocations(box90, width, height)
    const locations180 = possibleLocations(box180, width, height)
    const locations270 = possibleLocations(box270, width, height)

    const [firstCircuit, ...restCircuit] = locations.map(pointGroup => {
        const [first, ...rest] = pointGroup.map(point => encode({x: point.x, y: point.y, idOrEmpty: id}))
        return all(first, ...rest)
    })

    const [firstCircuit90, ...restCircuit90] = locations.map(pointGroup => {
        const [first, ...rest] = pointGroup.map(point => encode({x: point.x, y: point.y, idOrEmpty: id}))
        return all(first, ...rest)
    })

    const [firstCircuit180, ...restCircuit180] = locations.map(pointGroup => {
        const [first, ...rest] = pointGroup.map(point => encode({x: point.x, y: point.y, idOrEmpty: id}))
        return all(first, ...rest)
    })

    const [firstCircuit270, ...restCircuit270] = locations.map(pointGroup => {
        const [first, ...rest] = pointGroup.map(point => encode({x: point.x, y: point.y, idOrEmpty: id}))
        return all(first, ...rest)
    })

    return exactlyOne(
        and(exactlyOne(firstCircuit, ...restCircuit), `${id}:0`),
        and(exactlyOne(firstCircuit90, ...restCircuit90), `${id}:90`),
        and(exactlyOne(firstCircuit180, ...restCircuit180), `${id}:180`),
        and(exactlyOne(firstCircuit270, ...restCircuit270), `${id}:270`)
    )
}

function everyBoxInOneSpot(boxes: Box[], width: number, height: number): Circuit {
    const [first, ...rest] = boxes.map(box => boxInOneSpot(box, width, height))
    return all(first, ...rest)
}

export function everyPointIsExactlyOneColor(firstPoint: Point, restPoints: Point[], numberOfBoxes: number): Circuit {
    const first = isExactlyOneColor(firstPoint, numberOfBoxes)
    const rest = restPoints.map(point => isExactlyOneColor(point, numberOfBoxes))
    return all(first, ...rest)
}

function isExactlyOneColor(point: Point, numberOfBoxes: number): Circuit {
    const ids = range(numberOfBoxes + 1)

    // guaranteed to be nonempty because of the (+1) in range
    const [first, ...rest] = ids.map(id => encode({x: point.x, y: point.y, idOrEmpty: id}))

    return exactlyOne(first, ...rest)
}

function asCircuit(boxes: Box[], width: number, height: number): Circuit {
    // Assume width and height are greater than zero
    const [firstPoint, ...restPoints] = allPoints(width, height)

    return and(
        everyPointIsExactlyOneColor(firstPoint, restPoints, boxes.length),
        everyBoxInOneSpot(boxes, width, height)
    )
}

function allPoints(width: number, height: number): Point[] {
    let result: Point[] = []
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            result.push({x: i, y: j})
        }
    }

    return result
}

type TileConstraint = {
    x: number,
    y: number,
    idOrEmpty: number
}

function encode(tileConstraint: TileConstraint): string {
    return `${tileConstraint.x}|${tileConstraint.y}|${tileConstraint.idOrEmpty}`
}

function decode(str: string): Maybe<TileConstraint> {
    if (!str.includes('|')) {
        return Nothing()
    }

    const [x, y, idOrEmpty] = str.split('|').map(x => parseInt(x))

    return Just({x, y, idOrEmpty})
}

export function toString(tileConstraint: TileConstraint): string {
    return `The point (${tileConstraint.x}, ${tileConstraint.y}) is set by ${tileConstraint.idOrEmpty}`
}

export function solve(boxes: Box[], width: number, height: number): TileConstraint[] {
    const circuit = asCircuit(boxes, width, height)

    const maybeMap = satisfy(circuit)

    if (maybeMap.kind === 'Nothing') {
        return []
    }

    const trueStrings = getTrueAssignments(maybeMap.value)

    return justs(trueStrings.map(x => decode(x)))
}

export function getTrueAssignments(map: Map<string, boolean>): string[] {
    let result: string[] = []

    for (let [key, val] of map) {
        if (val) {
            result.push(key)
        }
    }

    return result
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