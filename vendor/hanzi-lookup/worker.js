// HKIME adapter. The upstream JS/WASM remain unmodified and replaceable.
importScripts('hanzi_lookup.js');
const ready = wasm_bindgen('hanzi_lookup_bg.wasm');
ready.then(() => postMessage({ type: 'ready' })).catch(() => postMessage({ type: 'error' }));
onmessage = async ({ data }) => {
    try {
        await ready;
        if (!Array.isArray(data.strokes) || data.strokes.length > 64) throw new Error('Invalid strokes');
        const matches = JSON.parse(wasm_bindgen.lookup(data.strokes, 12));
        postMessage({ type: 'result', id: data.id, matches });
    } catch { postMessage({ type: 'error', id: data.id }); }
};
