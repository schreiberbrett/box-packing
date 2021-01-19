<script lang="ts">
import { createEventDispatcher } from 'svelte'
import { range } from './util'

import type { Box } from './models'
import { empty, computeSquareStyle } from './models'

const dispatch = createEventDispatcher<{submit: Box}>()

function submit(): void {
    dispatch('submit', box)
}

export let id = 1

export let box = empty()

function occupy(i: number, j: number): void {
    box.squares[i][j] = id
}

function unoccupy(i: number, j: number): void {
    if (box.height === 1 && box.width === 1) {
        box = {
            height: 0,
            width: 0,
            squares: []
        }

        return
    }

    box.squares[i][j] = 0

    if (i === 0) {
        while (firstColumnEmpty()) {
            box = {
                height: box.height,
                width: box.width - 1,
                squares: box.squares.slice(1, box.width)
            }
        }
    }

    if (i === box.width - 1) {
        while (lastColumnEmpty()) {
            box = {
                height: box.height,
                width: box.width - 1,
                squares: box.squares.slice(0, box.width - 1)
            }
        }
    }

    if (j === 0) {
        while (firstRowEmpty()) {
            box = {
                height: box.height - 1,
                width: box.width,
                squares: box.squares.map(row => row.slice(1, box.height))
            }
        }
    }

    if (j === box.height - 1) {
        while (lastRowEmpty()) {
            box = {
                height: box.height - 1,
                width: box.width,
                squares: box.squares.map(row => row.slice(0, box.height - 1))
            }
        }
    }
}

function expandTop(): void {
    box = {
        height: box.height + 1,
        width: box.width,
        squares: box.squares.map(row => [0, ...row])
    }
}

function expandRight(): void {
    box = {
        height: box.height,
        width: box.width + 1,
        squares: [...box.squares, range(box.height).map(_ => 0)]
    } 
}

function expandLeft(): void {
    box = {
        height: box.height,
        width: box.width + 1,
        squares: [range(box.height).map(_ => 0), ...box.squares]
    }
}

function expandBottom(): void {
    box = {
        height: box.height + 1,
        width: box.width,
        squares: box.squares.map(row => [...row, 0])
    }
}

function clear(): void {
    box = empty()
}

function firstColumnEmpty() {
    for(let j = 0; j < box.height; j++) {
        if (box.squares[0][j] !== 0) {
            return false
        }
    }

    return true
}

function lastColumnEmpty() {
    for (let j = 0; j < box.height; j++) {
        if (box.squares[box.width - 1][j] !== 0) {
            return false
        }
    }

    return true
}

function firstRowEmpty() {
    for (let i = 0; i < box.width; i++) {
        if (box.squares[i][0] !== 0) {
            return false
        }
    }

    return true
}

function lastRowEmpty() {
    for (let i = 0; i < box.width; i++) {
        if (box.squares[i][box.height - 1] !== 0) {
            return false
        }
    }

    return true
}

</script>

<section style="grid-template-rows: {range(box.height + 3).map(_ => '80px').join(' ')}; grid-template-columns: {range(box.width + 2).map(_ => '80px').join(' ')}">
    <button class="square" on:click={_ => {
        expandTop()
        expandLeft()
        occupy(0, 0)
    }}></button>

    {#each range(box.width) as i}
        <button class="square" on:click={_ => {
            expandTop()
            occupy(i, 0)
        }}></button>
    {/each}

    <button class="square" on:click={_ => {
        expandTop()
        expandRight()
        occupy(box.width - 1, 0)
    }}></button>

    {#each range(box.height) as j}
        <button class="square" on:click={_ => {
            expandLeft()
            occupy(0, j)
        }}></button>

        {#each range(box.width) as i}
            {#if box.squares[i][j] > 0}
                <button class="square" on:click={_ => unoccupy(i, j)} style={computeSquareStyle(box, i, j)}></button>

            {:else}
                <button	class="square" on:click={_ => occupy(i, j)}></button>
            {/if}
        {/each}

        <button	class="square" on:click={_ => {
            expandRight()
            occupy(box.width - 1, j)
        }}></button>
    {/each}
        
    <button class="square" on:click={_ => {
        expandBottom()
        expandLeft()
        occupy(0, box.height - 1)
    }}></button>

    {#each range(box.width) as i}
        <button class="square" on:click={_ => {
            expandBottom()
            occupy(i, box.height - 1)
        }}></button>
    {/each}

    <button class="square" on:click={_ => {
        expandBottom()
        expandRight()
        occupy(box.width - 1, box.height - 1)
    }}></button>

    <button class="submit" on:click={submit}>Add</button>
    <button on:click={_ => clear()}>Clear</button>
</section>

<style>
section {
    display: grid;
}

.square {
    height: 100%;
    width: 100%;
}

.submit {
    grid-column-start: 1;
    grid-column-end: -2;

    grid-row-start: -2;
    grid-row-end: -1;
}
</style>