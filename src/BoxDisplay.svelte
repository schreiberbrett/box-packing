<script lang="ts">
import { computeSquareStyle, empty } from './models'
import { range } from './util'


export let box = empty()
</script>

<section style="grid-template-rows: {range(box.height).map(_ => '20px').join(' ')}; grid-template-columns: {range(box.width).map(_ => '20px').join(' ')}">
	{#each range(box.height) as j}
		{#each range(box.width) as i}
			<div style={computeSquareStyle(box, i, j)}></div>
		{/each}
	{/each}
</section>

<style>
	section {
		display: grid;
	}
</style>