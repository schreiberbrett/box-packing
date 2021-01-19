<script lang="ts">
import type { Box } from './models'
import { createEventDispatcher } from 'svelte'
import BoxDisplay from './BoxDisplay.svelte'

const deleteDispatch = createEventDispatcher<{delete: number}>()

export let boxes: Box[] = []
</script>

<table>
    {#each boxes as box, i}
        <tr>
            <td><BoxDisplay {box} /></td>
            <td><button on:click={_ => deleteDispatch('delete', i)}>Delete</button></td>
        </tr>
    {/each}
</table>