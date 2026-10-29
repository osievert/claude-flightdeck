const STEP_MS = 110;
/** Dashes drawn past the line's end and clipped by its box, so the right end is the box's edge. */
const SPARE = 4;
const Rail = (props, surface) => {
    const { Box, Text } = surface.elements;
    const ref = surface.state?.ref ?? { phase: 0, active: props.active };
    ref.active = props.active;
    if (surface.state === undefined) {
        surface.setState({ ref });
        surface.every(STEP_MS, () => {
            if (ref.active) {
                ref.phase += 1;
                surface.setState({ ref });
            }
        });
    }
    const width = Math.max(1, surface.columns || props.width);
    const cells = Array.from({ length: width + SPARE }, () => '─');
    for (const m of props.marks)
        if (m >= 0 && m < width)
            cells[m] = props.isMerge ? '┴' : '┬';
    // A graphical surface draws text in a proportional face, where ─ ● • and bold differ in width, so as
    // the packets moved the line's length changed and its right end jittered. Drawn in the surface's
    // monospaced face (whose advance is what a cell is there) each glyph is one cell, and the line sits in
    // a box of its width that clips the spare dashes: its right end is that edge, every frame.
    const line = (children) => (<Box width={width} overflow="hidden">
      <Box flexShrink={0}>{children}</Box>
    </Box>);
    if (!props.active) {
        return line(<Text color={props.dim} mono>
        {cells.join('')}
      </Text>);
    }
    // Two packets per 24 cells, a bright head and a trailing dot, moving left to right.
    const lit = new Map();
    for (let base = 0; base < width + 24; base += 24) {
        const head = (base + ref.phase) % (width + 24);
        if (head < width)
            lit.set(head, '●');
        if (head - 1 >= 0 && head - 1 < width)
            lit.set(head - 1, '•');
    }
    // Runs, not cells: consecutive cells of one kind share a Text, a handful of nodes per frame.
    const runs = [];
    cells.forEach((ch, i) => {
        const isLit = lit.has(i);
        const last = runs[runs.length - 1];
        const glyph = lit.get(i) ?? ch;
        if (last && last.isLit === isLit)
            last.text += glyph;
        else
            runs.push({ text: glyph, isLit });
    });
    return line(runs.map(r => (<Text color={r.isLit ? props.color : props.dim} bold={r.isLit} mono>
        {r.text}
      </Text>)));
};
export default Rail;
