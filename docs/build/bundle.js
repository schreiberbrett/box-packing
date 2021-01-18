
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function empty$1() {
        return {
            height: 0,
            width: 0,
            squares: []
        };
    }
    function computeSquareStyle(box, i, j) {
        return [
            `background-color: ${box.squares[i][j] === 0 ? 'white' : lookupColor(box.squares[i][j])};`,
            `border-top: ${(j === 0 || box.squares[i][j] !== box.squares[i][j - 1]) ? 3 : 0}px solid black;`,
            `border-bottom: ${j === box.height - 1 || box.squares[i][j] !== box.squares[i][j + 1] ? 3 : 0}px solid black;`,
            `border-left: ${(i === 0 || box.squares[i][j] !== box.squares[i - 1][j]) ? 3 : 0}px solid black;`,
            `border-right: ${(i === box.width - 1 || box.squares[i][j] !== box.squares[i + 1][j]) ? 3 : 0}px solid black;`
        ].join('');
    }
    function lookupColor(id) {
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
        ];
        return colors[id % colors.length];
    }

    function Nothing() {
        return { kind: 'Nothing' };
    }
    function Just(value) {
        return { kind: 'Just', value };
    }
    function range(n) {
        let result = [];
        for (let i = 0; i < n; i++) {
            result.push(i);
        }
        return result;
    }
    function flatMap(as, f) {
        let result = [];
        for (let a of as) {
            result.push(...f(a));
        }
        return result;
    }

    function solve(problem) {
        return helper(problem, []);
        function helper(problem, currentAssignments) {
            const result = search(problem);
            switch (result.kind) {
                case 'No More Items':
                    return Just(currentAssignments);
                case 'No Possible Positions For An Item':
                    return Nothing();
                case 'Exactly One Position':
                    return helper(withItemInPosition(problem, result.position), [...currentAssignments, result.position]);
                case 'Need To Try All Positions':
                    for (let position of result.item.possiblePositions) {
                        const namedPosition = {
                            id: result.item.id, spacesTaken: position.spacesTaken
                        };
                        const maybePositions = helper(withItemInPosition(problem, namedPosition), [...currentAssignments, namedPosition]);
                        if (maybePositions.kind === 'Just') {
                            return maybePositions;
                        }
                    }
                    return Nothing();
            }
        }
    }
    function withItemInPosition(problem, position) {
        return removeSpaces({ items: problem.items.filter(item => item.id !== position.id) }, [...position.spacesTaken.values()]);
    }
    function removeSpaces(problem, spaces) {
        return {
            items: problem.items.map(item => ({
                id: item.id,
                possiblePositions: item.possiblePositions.filter(position => !spaces.some(space => position.spacesTaken.has(space)))
            }))
        };
    }
    function search(problem) {
        if (problem.items.length === 0) {
            return { kind: 'No More Items' };
        }
        for (let item of problem.items) {
            if (item.possiblePositions.length === 0) {
                return { kind: 'No Possible Positions For An Item' };
            }
            if (item.possiblePositions.length === 1) {
                return { kind: 'Exactly One Position', position: { id: item.id, spacesTaken: item.possiblePositions[0].spacesTaken } };
            }
        }
        return { kind: 'Need To Try All Positions', item: problem.items[0] };
    }
    function toBox(positions, width, height) {
        let squares = range(width).map(i => range(height).map(j => 0));
        for (let position of positions) {
            for (let space of position.spacesTaken.values()) {
                const { x, y } = fromNumber(space, width);
                squares[x][y] = position.id;
            }
        }
        return {
            width,
            height,
            squares
        };
    }
    function fromNumber(n, width) {
        return {
            x: n % width,
            y: Math.floor(n / width)
        };
    }

    function make(boxes, width, height) {
        return {
            items: boxes.map(box => makeItem(box, width, height))
        };
    }
    function makeItem(box, width, height) {
        return {
            id: getId(box),
            possiblePositions: allPossibleLocations(box, width, height)
                .map(points => ({ spacesTaken: new Set(points.map(point => toNumber(point, width))) }))
        };
    }
    function toNumber(point, width) {
        return point.y * width + point.x;
    }
    function getId(box) {
        for (let j = 0; j < box.height; j++) {
            for (let i = 0; i < box.width; i++) {
                if (box.squares[i][j] !== 0) {
                    return box.squares[i][j];
                }
            }
        }
        return -1;
    }
    function coordinates(box) {
        let result = [];
        for (let j = 0; j < box.height; j++) {
            for (let i = 0; i < box.width; i++) {
                if (box.squares[i][j] !== 0) {
                    result.push({ x: i, y: j });
                }
            }
        }
        return result;
    }
    function possibleLocations(box, width, height) {
        const offsetPoints = coordinates(box);
        let locations = [];
        for (let j = 0; j < (height - box.height) + 1; j++) {
            for (let i = 0; i < (width - box.width) + 1; i++) {
                locations.push(offsetPoints.map(({ x, y }) => ({ x: x + i, y: y + j })));
            }
        }
        return locations;
    }
    function allPossibleLocations(box, width, height) {
        const box90 = rotate(box);
        const box180 = rotate(box90);
        const box270 = rotate(box180);
        return flatMap([box, box90, box180, box270], x => possibleLocations(x, width, height));
    }
    function rotate(box) {
        let rotatedBox = {
            height: box.width,
            width: box.height,
            squares: range(box.height).map(_ => [])
        };
        for (let j = 0; j < box.height; j++) {
            for (let i = 0; i < box.width; i++) {
                rotatedBox.squares[box.height - j - 1][i] = box.squares[i][j];
            }
        }
        return rotatedBox;
    }

    /* src/BoxBuilder.svelte generated by Svelte v3.31.0 */
    const file = "src/BoxBuilder.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    // (134:4) {#each range(box.width) as i}
    function create_each_block_3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[12](/*i*/ ctx[27], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "square svelte-llkym6");
    			add_location(button, file, 134, 8, 3339);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(134:4) {#each range(box.width) as i}",
    		ctx
    	});

    	return block;
    }

    // (157:12) {:else}
    function create_else_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler_5(...args) {
    		return /*click_handler_5*/ ctx[16](/*i*/ ctx[27], /*j*/ ctx[30], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "square svelte-llkym6");
    			add_location(button, file, 157, 16, 3987);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_5, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(157:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (154:12) {#if box.squares[i][j] > 0}
    function create_if_block(ctx) {
    	let button;
    	let button_style_value;
    	let mounted;
    	let dispose;

    	function click_handler_4(...args) {
    		return /*click_handler_4*/ ctx[15](/*i*/ ctx[27], /*j*/ ctx[30], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "square svelte-llkym6");
    			attr_dev(button, "style", button_style_value = computeSquareStyle(/*box*/ ctx[0], /*i*/ ctx[27], /*j*/ ctx[30]));
    			add_location(button, file, 154, 16, 3848);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_4, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*box*/ 1 && button_style_value !== (button_style_value = computeSquareStyle(/*box*/ ctx[0], /*i*/ ctx[27], /*j*/ ctx[30]))) {
    				attr_dev(button, "style", button_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(154:12) {#if box.squares[i][j] > 0}",
    		ctx
    	});

    	return block;
    }

    // (153:8) {#each range(box.width) as i}
    function create_each_block_2(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*box*/ ctx[0].squares[/*i*/ ctx[27]][/*j*/ ctx[30]] > 0) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(153:8) {#each range(box.width) as i}",
    		ctx
    	});

    	return block;
    }

    // (147:4) {#each range(box.height) as j}
    function create_each_block_1(ctx) {
    	let button0;
    	let t0;
    	let t1;
    	let button1;
    	let mounted;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[14](/*j*/ ctx[30], ...args);
    	}

    	let each_value_2 = range(/*box*/ ctx[0].width);
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	function click_handler_6(...args) {
    		return /*click_handler_6*/ ctx[17](/*j*/ ctx[30], ...args);
    	}

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			button1 = element("button");
    			attr_dev(button0, "class", "square svelte-llkym6");
    			add_location(button0, file, 147, 8, 3642);
    			attr_dev(button1, "class", "square svelte-llkym6");
    			add_location(button1, file, 161, 8, 4092);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler_3, false, false, false),
    					listen_dev(button1, "click", click_handler_6, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*box, unoccupy, occupy*/ 25) {
    				each_value_2 = range(/*box*/ ctx[0].width);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t1.parentNode, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(147:4) {#each range(box.height) as j}",
    		ctx
    	});

    	return block;
    }

    // (174:4) {#each range(box.width) as i}
    function create_each_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler_8(...args) {
    		return /*click_handler_8*/ ctx[19](/*i*/ ctx[27], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "square svelte-llkym6");
    			add_location(button, file, 174, 8, 4419);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_8, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(174:4) {#each range(box.width) as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let section;
    	let button0;
    	let t0;
    	let t1;
    	let button1;
    	let t2;
    	let t3;
    	let button2;
    	let t4;
    	let t5;
    	let button3;
    	let t6;
    	let button4;
    	let t7;
    	let t8;
    	let button5;
    	let mounted;
    	let dispose;
    	let each_value_3 = range(/*box*/ ctx[0].width);
    	validate_each_argument(each_value_3);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_1 = range(/*box*/ ctx[0].height);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = range(/*box*/ ctx[0].width);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			button0 = element("button");
    			t0 = space();

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t1 = space();
    			button1 = element("button");
    			t2 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t3 = space();
    			button2 = element("button");
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			button3 = element("button");
    			t6 = space();
    			button4 = element("button");
    			t7 = text(/*mode*/ ctx[1]);
    			t8 = space();
    			button5 = element("button");
    			button5.textContent = "Clear";
    			attr_dev(button0, "class", "square svelte-llkym6");
    			add_location(button0, file, 127, 4, 3177);
    			attr_dev(button1, "class", "square svelte-llkym6");
    			add_location(button1, file, 140, 4, 3466);
    			attr_dev(button2, "class", "square svelte-llkym6");
    			add_location(button2, file, 167, 4, 4241);
    			attr_dev(button3, "class", "square svelte-llkym6");
    			add_location(button3, file, 180, 4, 4562);
    			attr_dev(button4, "class", "submit svelte-llkym6");
    			add_location(button4, file, 186, 4, 4715);
    			add_location(button5, file, 187, 4, 4776);
    			set_style(section, "grid-template-rows", range(/*box*/ ctx[0].height + 3).map(func).join(" "));
    			set_style(section, "grid-template-columns", range(/*box*/ ctx[0].width + 2).map(func_1).join(" "));
    			attr_dev(section, "class", "svelte-llkym6");
    			add_location(section, file, 126, 0, 3010);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, button0);
    			append_dev(section, t0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(section, null);
    			}

    			append_dev(section, t1);
    			append_dev(section, button1);
    			append_dev(section, t2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(section, null);
    			}

    			append_dev(section, t3);
    			append_dev(section, button2);
    			append_dev(section, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			append_dev(section, t5);
    			append_dev(section, button3);
    			append_dev(section, t6);
    			append_dev(section, button4);
    			append_dev(button4, t7);
    			append_dev(section, t8);
    			append_dev(section, button5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[11], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[13], false, false, false),
    					listen_dev(button2, "click", /*click_handler_7*/ ctx[18], false, false, false),
    					listen_dev(button3, "click", /*click_handler_9*/ ctx[20], false, false, false),
    					listen_dev(button4, "click", /*submit*/ ctx[2], false, false, false),
    					listen_dev(button5, "click", /*click_handler_10*/ ctx[21], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*expandTop, occupy, box*/ 41) {
    				each_value_3 = range(/*box*/ ctx[0].width);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_3(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(section, t1);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_3.length;
    			}

    			if (dirty[0] & /*expandRight, occupy, box, unoccupy, expandLeft*/ 217) {
    				each_value_1 = range(/*box*/ ctx[0].height);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(section, t3);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*expandBottom, occupy, box*/ 265) {
    				each_value = range(/*box*/ ctx[0].width);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(section, t5);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*mode*/ 2) set_data_dev(t7, /*mode*/ ctx[1]);

    			if (dirty[0] & /*box*/ 1) {
    				set_style(section, "grid-template-rows", range(/*box*/ ctx[0].height + 3).map(func).join(" "));
    			}

    			if (dirty[0] & /*box*/ 1) {
    				set_style(section, "grid-template-columns", range(/*box*/ ctx[0].width + 2).map(func_1).join(" "));
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = _ => "80px";
    const func_1 = _ => "80px";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BoxBuilder", slots, []);
    	
    	const dispatch = createEventDispatcher();

    	function submit() {
    		dispatch("submit", box);
    	}

    	let { id = 1 } = $$props;
    	let { box = empty$1() } = $$props;
    	let { mode = "Add" } = $$props;

    	function occupy(i, j) {
    		$$invalidate(0, box.squares[i][j] = id, box);
    	}

    	function unoccupy(i, j) {
    		if (box.height === 1 && box.width === 1) {
    			$$invalidate(0, box = { height: 0, width: 0, squares: [] });
    			return;
    		}

    		$$invalidate(0, box.squares[i][j] = 0, box);

    		if (i === 0) {
    			while (firstColumnEmpty()) {
    				$$invalidate(0, box = {
    					height: box.height,
    					width: box.width - 1,
    					squares: box.squares.slice(1, box.width)
    				});
    			}
    		}

    		if (i === box.width - 1) {
    			while (lastColumnEmpty()) {
    				$$invalidate(0, box = {
    					height: box.height,
    					width: box.width - 1,
    					squares: box.squares.slice(0, box.width - 1)
    				});
    			}
    		}

    		if (j === 0) {
    			while (firstRowEmpty()) {
    				$$invalidate(0, box = {
    					height: box.height - 1,
    					width: box.width,
    					squares: box.squares.map(row => row.slice(1, box.height))
    				});
    			}
    		}

    		if (j === box.height - 1) {
    			while (lastRowEmpty()) {
    				$$invalidate(0, box = {
    					height: box.height - 1,
    					width: box.width,
    					squares: box.squares.map(row => row.slice(0, box.height - 1))
    				});
    			}
    		}
    	}

    	function expandTop() {
    		$$invalidate(0, box = {
    			height: box.height + 1,
    			width: box.width,
    			squares: box.squares.map(row => [0, ...row])
    		});
    	}

    	function expandRight() {
    		$$invalidate(0, box = {
    			height: box.height,
    			width: box.width + 1,
    			squares: [...box.squares, range(box.height).map(_ => 0)]
    		});
    	}

    	function expandLeft() {
    		$$invalidate(0, box = {
    			height: box.height,
    			width: box.width + 1,
    			squares: [range(box.height).map(_ => 0), ...box.squares]
    		});
    	}

    	function expandBottom() {
    		$$invalidate(0, box = {
    			height: box.height + 1,
    			width: box.width,
    			squares: box.squares.map(row => [...row, 0])
    		});
    	}

    	function clear() {
    		$$invalidate(0, box = empty$1());
    	}

    	function firstColumnEmpty() {
    		for (let j = 0; j < box.height; j++) {
    			if (box.squares[0][j] !== 0) {
    				return false;
    			}
    		}

    		return true;
    	}

    	function lastColumnEmpty() {
    		for (let j = 0; j < box.height; j++) {
    			if (box.squares[box.width - 1][j] !== 0) {
    				return false;
    			}
    		}

    		return true;
    	}

    	function firstRowEmpty() {
    		for (let i = 0; i < box.width; i++) {
    			if (box.squares[i][0] !== 0) {
    				return false;
    			}
    		}

    		return true;
    	}

    	function lastRowEmpty() {
    		for (let i = 0; i < box.width; i++) {
    			if (box.squares[i][box.height - 1] !== 0) {
    				return false;
    			}
    		}

    		return true;
    	}

    	const writable_props = ["id", "box", "mode"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BoxBuilder> was created with unknown prop '${key}'`);
    	});

    	const click_handler = _ => {
    		expandTop();
    		expandLeft();
    		occupy(0, 0);
    	};

    	const click_handler_1 = (i, _) => {
    		expandTop();
    		occupy(i, 0);
    	};

    	const click_handler_2 = _ => {
    		expandTop();
    		expandRight();
    		occupy(box.width - 1, 0);
    	};

    	const click_handler_3 = (j, _) => {
    		expandLeft();
    		occupy(0, j);
    	};

    	const click_handler_4 = (i, j, _) => unoccupy(i, j);
    	const click_handler_5 = (i, j, _) => occupy(i, j);

    	const click_handler_6 = (j, _) => {
    		expandRight();
    		occupy(box.width - 1, j);
    	};

    	const click_handler_7 = _ => {
    		expandBottom();
    		expandLeft();
    		occupy(0, box.height - 1);
    	};

    	const click_handler_8 = (i, _) => {
    		expandBottom();
    		occupy(i, box.height - 1);
    	};

    	const click_handler_9 = _ => {
    		expandBottom();
    		expandRight();
    		occupy(box.width - 1, box.height - 1);
    	};

    	const click_handler_10 = _ => clear();

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(10, id = $$props.id);
    		if ("box" in $$props) $$invalidate(0, box = $$props.box);
    		if ("mode" in $$props) $$invalidate(1, mode = $$props.mode);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		range,
    		empty: empty$1,
    		computeSquareStyle,
    		dispatch,
    		submit,
    		id,
    		box,
    		mode,
    		occupy,
    		unoccupy,
    		expandTop,
    		expandRight,
    		expandLeft,
    		expandBottom,
    		clear,
    		firstColumnEmpty,
    		lastColumnEmpty,
    		firstRowEmpty,
    		lastRowEmpty
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(10, id = $$props.id);
    		if ("box" in $$props) $$invalidate(0, box = $$props.box);
    		if ("mode" in $$props) $$invalidate(1, mode = $$props.mode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		box,
    		mode,
    		submit,
    		occupy,
    		unoccupy,
    		expandTop,
    		expandRight,
    		expandLeft,
    		expandBottom,
    		clear,
    		id,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10
    	];
    }

    class BoxBuilder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { id: 10, box: 0, mode: 1 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BoxBuilder",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get id() {
    		throw new Error("<BoxBuilder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<BoxBuilder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get box() {
    		throw new Error("<BoxBuilder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set box(value) {
    		throw new Error("<BoxBuilder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get mode() {
    		throw new Error("<BoxBuilder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<BoxBuilder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/BoxDisplay.svelte generated by Svelte v3.31.0 */
    const file$1 = "src/BoxDisplay.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (8:2) {#each range(box.width) as i}
    function create_each_block_1$1(ctx) {
    	let div;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "style", div_style_value = computeSquareStyle(/*box*/ ctx[0], /*i*/ ctx[4], /*j*/ ctx[1]));
    			add_location(div, file$1, 8, 3, 363);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*box*/ 1 && div_style_value !== (div_style_value = computeSquareStyle(/*box*/ ctx[0], /*i*/ ctx[4], /*j*/ ctx[1]))) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(8:2) {#each range(box.width) as i}",
    		ctx
    	});

    	return block;
    }

    // (7:1) {#each range(box.height) as j}
    function create_each_block$1(ctx) {
    	let each_1_anchor;
    	let each_value_1 = range(/*box*/ ctx[0].width);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*computeSquareStyle, box, range*/ 1) {
    				each_value_1 = range(/*box*/ ctx[0].width);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(7:1) {#each range(box.height) as j}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let section;
    	let each_value = range(/*box*/ ctx[0].height);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(section, "grid-template-rows", range(/*box*/ ctx[0].height).map(func$1).join(" "));
    			set_style(section, "grid-template-columns", range(/*box*/ ctx[0].width).map(func_1$1).join(" "));
    			attr_dev(section, "class", "svelte-v9ytl5");
    			add_location(section, file$1, 5, 0, 141);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*range, box, computeSquareStyle*/ 1) {
    				each_value = range(/*box*/ ctx[0].height);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(section, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*box*/ 1) {
    				set_style(section, "grid-template-rows", range(/*box*/ ctx[0].height).map(func$1).join(" "));
    			}

    			if (dirty & /*box*/ 1) {
    				set_style(section, "grid-template-columns", range(/*box*/ ctx[0].width).map(func_1$1).join(" "));
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func$1 = _ => "20px";
    const func_1$1 = _ => "20px";

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BoxDisplay", slots, []);
    	let { box = empty$1() } = $$props;
    	const writable_props = ["box"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BoxDisplay> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("box" in $$props) $$invalidate(0, box = $$props.box);
    	};

    	$$self.$capture_state = () => ({ computeSquareStyle, empty: empty$1, range, box });

    	$$self.$inject_state = $$props => {
    		if ("box" in $$props) $$invalidate(0, box = $$props.box);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [box];
    }

    class BoxDisplay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { box: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BoxDisplay",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get box() {
    		throw new Error("<BoxDisplay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set box(value) {
    		throw new Error("<BoxDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/BoxList.svelte generated by Svelte v3.31.0 */
    const file$2 = "src/BoxList.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (10:4) {#each boxes as box, i}
    function create_each_block$2(ctx) {
    	let tr;
    	let td0;
    	let boxdisplay;
    	let t0;
    	let td1;
    	let button0;
    	let t2;
    	let td2;
    	let button1;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;

    	boxdisplay = new BoxDisplay({
    			props: { box: /*box*/ ctx[5] },
    			$$inline: true
    		});

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[3](/*i*/ ctx[7], ...args);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[4](/*i*/ ctx[7], ...args);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			create_component(boxdisplay.$$.fragment);
    			t0 = space();
    			td1 = element("td");
    			button0 = element("button");
    			button0.textContent = "Edit";
    			t2 = space();
    			td2 = element("td");
    			button1 = element("button");
    			button1.textContent = "Delete";
    			t4 = space();
    			add_location(td0, file$2, 11, 12, 303);
    			add_location(button0, file$2, 12, 16, 349);
    			add_location(td1, file$2, 12, 12, 345);
    			add_location(button1, file$2, 13, 16, 432);
    			add_location(td2, file$2, 13, 12, 428);
    			add_location(tr, file$2, 10, 8, 286);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			mount_component(boxdisplay, td0, null);
    			append_dev(tr, t0);
    			append_dev(tr, td1);
    			append_dev(td1, button0);
    			append_dev(tr, t2);
    			append_dev(tr, td2);
    			append_dev(td2, button1);
    			append_dev(tr, t4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const boxdisplay_changes = {};
    			if (dirty & /*boxes*/ 1) boxdisplay_changes.box = /*box*/ ctx[5];
    			boxdisplay.$set(boxdisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(boxdisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(boxdisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(boxdisplay);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(10:4) {#each boxes as box, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let table;
    	let current;
    	let each_value = /*boxes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(table, file$2, 8, 0, 242);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*deleteDispatch, editDispatch, boxes*/ 7) {
    				each_value = /*boxes*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BoxList", slots, []);
    	
    	const editDispatch = createEventDispatcher();
    	const deleteDispatch = createEventDispatcher();
    	let { boxes = [] } = $$props;
    	const writable_props = ["boxes"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BoxList> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (i, _) => editDispatch("edit", i);
    	const click_handler_1 = (i, _) => deleteDispatch("delete", i);

    	$$self.$$set = $$props => {
    		if ("boxes" in $$props) $$invalidate(0, boxes = $$props.boxes);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		BoxDisplay,
    		editDispatch,
    		deleteDispatch,
    		boxes
    	});

    	$$self.$inject_state = $$props => {
    		if ("boxes" in $$props) $$invalidate(0, boxes = $$props.boxes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [boxes, editDispatch, deleteDispatch, click_handler, click_handler_1];
    }

    class BoxList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { boxes: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BoxList",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get boxes() {
    		throw new Error("<BoxList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set boxes(value) {
    		throw new Error("<BoxList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */
    const file$3 = "src/App.svelte";

    // (57:1) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("No solution");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(57:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (55:1) {#if result.kind === 'Just'}
    function create_if_block$1(ctx) {
    	let boxdisplay;
    	let current;

    	boxdisplay = new BoxDisplay({
    			props: { box: /*result*/ ctx[3].value },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(boxdisplay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(boxdisplay, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const boxdisplay_changes = {};
    			if (dirty & /*result*/ 8) boxdisplay_changes.box = /*result*/ ctx[3].value;
    			boxdisplay.$set(boxdisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(boxdisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(boxdisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(boxdisplay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(55:1) {#if result.kind === 'Just'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let boxbuilder;
    	let t0;
    	let boxlist;
    	let t1;
    	let label0;
    	let t3;
    	let input0;
    	let input0_min_value;
    	let t4;
    	let label1;
    	let t6;
    	let input1;
    	let input1_min_value;
    	let t7;
    	let p;
    	let button;
    	let t9;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;

    	boxbuilder = new BoxBuilder({
    			props: {
    				id: /*workingIndex*/ ctx[1] + 1,
    				mode: /*mode*/ ctx[4],
    				box: /*box*/ ctx[2]
    			},
    			$$inline: true
    		});

    	boxbuilder.$on("submit", /*submit_handler*/ ctx[7]);

    	boxlist = new BoxList({
    			props: { boxes: /*boxes*/ ctx[0] },
    			$$inline: true
    		});

    	boxlist.$on("delete", /*delete_handler*/ ctx[8]);
    	boxlist.$on("edit", /*edit_handler*/ ctx[9]);
    	const if_block_creators = [create_if_block$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*result*/ ctx[3].kind === "Just") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(boxbuilder.$$.fragment);
    			t0 = space();
    			create_component(boxlist.$$.fragment);
    			t1 = space();
    			label0 = element("label");
    			label0.textContent = "Width";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			label1.textContent = "Height";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			p = element("p");
    			button = element("button");
    			button.textContent = "New satisfy";
    			t9 = space();
    			if_block.c();
    			attr_dev(label0, "for", "width");
    			add_location(label0, file$3, 37, 1, 894);
    			attr_dev(input0, "id", "width");
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "min", input0_min_value = Math.max(0, .../*boxes*/ ctx[0].map(/*func*/ ctx[10])));
    			add_location(input0, file$3, 38, 1, 928);
    			attr_dev(label1, "for", "height");
    			add_location(label1, file$3, 40, 1, 1054);
    			attr_dev(input1, "id", "height");
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "min", input1_min_value = Math.max(0, .../*boxes*/ ctx[0].map(/*func_1*/ ctx[12])));
    			add_location(input1, file$3, 41, 1, 1090);
    			add_location(button, file$3, 44, 4, 1222);
    			add_location(p, file$3, 44, 1, 1219);
    			add_location(main, file$3, 17, 0, 420);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(boxbuilder, main, null);
    			append_dev(main, t0);
    			mount_component(boxlist, main, null);
    			append_dev(main, t1);
    			append_dev(main, label0);
    			append_dev(main, t3);
    			append_dev(main, input0);
    			set_input_value(input0, /*width*/ ctx[5]);
    			append_dev(main, t4);
    			append_dev(main, label1);
    			append_dev(main, t6);
    			append_dev(main, input1);
    			set_input_value(input1, /*height*/ ctx[6]);
    			append_dev(main, t7);
    			append_dev(main, p);
    			append_dev(p, button);
    			append_dev(main, t9);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[13]),
    					listen_dev(button, "click", /*click_handler*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const boxbuilder_changes = {};
    			if (dirty & /*workingIndex*/ 2) boxbuilder_changes.id = /*workingIndex*/ ctx[1] + 1;
    			if (dirty & /*mode*/ 16) boxbuilder_changes.mode = /*mode*/ ctx[4];
    			if (dirty & /*box*/ 4) boxbuilder_changes.box = /*box*/ ctx[2];
    			boxbuilder.$set(boxbuilder_changes);
    			const boxlist_changes = {};
    			if (dirty & /*boxes*/ 1) boxlist_changes.boxes = /*boxes*/ ctx[0];
    			boxlist.$set(boxlist_changes);

    			if (!current || dirty & /*boxes*/ 1 && input0_min_value !== (input0_min_value = Math.max(0, .../*boxes*/ ctx[0].map(/*func*/ ctx[10])))) {
    				attr_dev(input0, "min", input0_min_value);
    			}

    			if (dirty & /*width*/ 32 && to_number(input0.value) !== /*width*/ ctx[5]) {
    				set_input_value(input0, /*width*/ ctx[5]);
    			}

    			if (!current || dirty & /*boxes*/ 1 && input1_min_value !== (input1_min_value = Math.max(0, .../*boxes*/ ctx[0].map(/*func_1*/ ctx[12])))) {
    				attr_dev(input1, "min", input1_min_value);
    			}

    			if (dirty & /*height*/ 64 && to_number(input1.value) !== /*height*/ ctx[6]) {
    				set_input_value(input1, /*height*/ ctx[6]);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(boxbuilder.$$.fragment, local);
    			transition_in(boxlist.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(boxbuilder.$$.fragment, local);
    			transition_out(boxlist.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(boxbuilder);
    			destroy_component(boxlist);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	
    	
    	let boxes = [];
    	let workingIndex = 0;
    	let box = empty$1();
    	let result = { kind: "Nothing" };
    	let mode = "Add";
    	let width = 0;
    	let height = 0;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const submit_handler = event => {
    		if (mode === "Add") {
    			$$invalidate(0, boxes = [...boxes, event.detail]);
    			$$invalidate(1, workingIndex++, workingIndex);
    		} else {
    			$$invalidate(0, boxes[workingIndex] = event.detail, boxes);
    			$$invalidate(4, mode = "Add");
    			$$invalidate(1, workingIndex = boxes.length);
    		}

    		$$invalidate(2, box = empty$1());
    	};

    	const delete_handler = event => $$invalidate(0, boxes = boxes.filter((_, i) => i !== event.detail));

    	const edit_handler = event => {
    		$$invalidate(4, mode = "Update");
    		$$invalidate(2, box = boxes[event.detail]);
    		$$invalidate(1, workingIndex = event.detail);
    	};

    	const func = box => Math.min(box.width, box.height);

    	function input0_input_handler() {
    		width = to_number(this.value);
    		$$invalidate(5, width);
    	}

    	const func_1 = box => Math.min(box.width, box.height);

    	function input1_input_handler() {
    		height = to_number(this.value);
    		$$invalidate(6, height);
    	}

    	const click_handler = _ => {
    		const x = solve(make(boxes, width, height));

    		if (x.kind === "Just") {
    			$$invalidate(3, result = {
    				kind: "Just",
    				value: toBox(x.value, width, height)
    			});
    		} else {
    			$$invalidate(3, result = { kind: "Nothing" });
    		}
    	};

    	$$self.$capture_state = () => ({
    		empty: empty$1,
    		solve,
    		toBox,
    		make,
    		BoxBuilder,
    		BoxList,
    		BoxDisplay,
    		boxes,
    		workingIndex,
    		box,
    		result,
    		mode,
    		width,
    		height
    	});

    	$$self.$inject_state = $$props => {
    		if ("boxes" in $$props) $$invalidate(0, boxes = $$props.boxes);
    		if ("workingIndex" in $$props) $$invalidate(1, workingIndex = $$props.workingIndex);
    		if ("box" in $$props) $$invalidate(2, box = $$props.box);
    		if ("result" in $$props) $$invalidate(3, result = $$props.result);
    		if ("mode" in $$props) $$invalidate(4, mode = $$props.mode);
    		if ("width" in $$props) $$invalidate(5, width = $$props.width);
    		if ("height" in $$props) $$invalidate(6, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		boxes,
    		workingIndex,
    		box,
    		result,
    		mode,
    		width,
    		height,
    		submit_handler,
    		delete_handler,
    		edit_handler,
    		func,
    		input0_input_handler,
    		func_1,
    		input1_input_handler,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
