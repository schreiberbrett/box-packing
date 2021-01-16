<script lang="ts">
import type { Circuit } from './Circuit'
import { satisfy } from './Circuit';

import { and, or, not, none, exactlyOne, all, atLeastOne } from './CircuitBuilder'

import type { Box } from './models'
import { empty, solve, toString } from './models'

import BoxBuilder from './BoxBuilder.svelte'
import BoxList from './BoxList.svelte'
import BoxDisplay from './BoxDisplay.svelte';
import { range } from './util';

const myCircuit = all(
		exactlyOne('Name is Brett', 'Name is Courtney', 'Name is Nicole'),
		or(not('Name is Nicole'), not('Over 21')),
		or(not('Name is Courtney'), not('Over 21')),
		or(not('Can Drink'), 'Over 21'),
		'Can Drink'
	)

let boxes: Box[] = []
let workingIndex = 0
let box = empty()

let mode: 'Add' | 'Update' = 'Add'
</script>

<main>
	<button on:click={_ => console.log(satisfy(myCircuit))}>Click here to solve</button>
	
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

	<button on:click={_ => console.log(satisfy(
		all(
			exactlyOne('A0', 'A1', 'A2'),
			exactlyOne('B0', 'B1', 'B2'),
			exactlyOne('A0', 'B0', 'A1', 'B1')
		)))
		
		
	}>Test circuits</button>

	<button on:click={_ => console.log(solve(boxes, 3, 3).map(toString))}>New satisfy</button>
</main>

<style>

</style>