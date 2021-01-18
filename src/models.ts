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
        'maroon',
        'brown',
        'olive',
        'teal',
        'navy',
        'red',
        'orange',
        'yellow',
        'lime',
        'green',
        'cyan',
        'blue',
        'purple',
        'magenta',
        'grey',
        'pink',
        'apricot',
        'beige',
        'mint',
        'lavender'
    ]

    return colors[id % colors.length]
}
