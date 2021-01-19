<script lang="ts">
import type { Maybe } from './util'
import type { Box } from './models'
import { sumBy, map } from './util'
import { empty } from './models'
import { solve, toBox } from './solve'
import { make } from './PackingProblem'

import BoxBuilder from './BoxBuilder.svelte'
import BoxList from './BoxList.svelte'
import BoxDisplay from './BoxDisplay.svelte'

let boxes: Box[] = []
let workingIndex = 0
let box = empty()

let result: Maybe<Box> = {kind: 'Nothing'}

function descendingRange(n: number): [number, number][] {
	let result: [number, number][] = []

	for (let i = 0; i < n; i++) {
		for (let j = 0; j <= i; j++) {
			result.push([i - j, j])
		}
	}

	return result
}

</script>

<main>
	<section id="box-builder">
		<BoxBuilder id={workingIndex + 1} {box} on:submit={event => {
			boxes = [...boxes, event.detail]
			workingIndex++
			box = empty()
		}}/>
	</section>

	<button on:click={_ => {
		const maximumDimension = sumBy(boxes, box => Math.max(box.width, box.height))
		const widthsAndHeights = descendingRange(maximumDimension * 2)
			.filter(([width, height]) => width <= height)

		for (let [width, height] of widthsAndHeights) {
			result = map(solve(make(boxes, width, height)), x => toBox(x, width, height))

			if (result.kind === 'Just') {
				break
			}
		}
	}}>Solve</button>

	<section id="box-list">
		<BoxList {boxes} on:delete={event => boxes = boxes.filter((_, i) => i !== event.detail)}/>
	</section>

	<section id="result">
	{#if result.kind === 'Just'}
		<BoxDisplay box={result.value} />
	{/if}
	</section>
</main>

<style>
	main {
		display: grid;
		grid-template-areas:
			"box-builder box-builder"
			"solve       solve"
			"box-list    result";

		justify-items: center;
	}

	button {
		grid-area: solve;
	}

	#box-builder {
		grid-area: box-builder;
	}

	#box-list {
		grid-area: box-list;
	}

	#result {
		grid-area: result;
	}
</style>