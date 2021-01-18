<script lang="ts">
import type { Maybe } from './util'
import type { Box } from './models'
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

let mode: 'Add' | 'Update' = 'Add'

let width = 0
let height = 0
</script>

<main>	
	<BoxBuilder id={workingIndex + 1} {mode} {box} on:submit={event => {
		if (mode === 'Add') {
			boxes = [...boxes, event.detail]
			workingIndex++
		} else {
			boxes[workingIndex] = event.detail
			mode = 'Add'
			workingIndex = boxes.length
		}

		box = empty()
	}}/>

	<BoxList {boxes} on:delete={event => boxes = boxes.filter((_, i) => i !== event.detail)} on:edit={event => {
		mode = 'Update'
		box = boxes[event.detail]
		workingIndex = event.detail
	}}/>

	<label for="width">Width</label>
	<input id="width" type="number" min={Math.max(0, ...boxes.map(box => Math.min(box.width, box.height)))} bind:value={width}>

	<label for="height">Height</label>
	<input id="height" type="number" min={Math.max(0, ...boxes.map(box => Math.min(box.width, box.height)))} bind:value={height}>


	<p><button on:click={_ => {
		const x = solve(make(boxes, width, height))
		if (x.kind === 'Just') {
			result = {kind: 'Just', value: toBox(x.value, width, height)}
		} else {
			result = {kind: 'Nothing'}
		}
	}}>New satisfy</button>
	</p>

	{#if result.kind === 'Just'}
		<BoxDisplay box={result.value} />
	{:else}
		No solution
	{/if}
</main>

<style>

</style>