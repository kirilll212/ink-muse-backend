export const BODY_PARTS = [
    'arm',
    'forearm',
    'shoulder',
    'chest',
    'back',
    'leg',
    'calf',
    'ankle',
    'wrist',
    'hand',
    'neck',
    'ribs',
];
export const STYLES = [
    'line-art',
    'minimalist',
    'geometric',
    'traditional',
    'neo-traditional',
    'realistic',
    'blackwork',
    'dotwork',
    'tribal',
    'watercolor',
    'japanese',
    'new-school',
    'sketch',
    'ornamental',
    'surrealism',
    'engraving',
    'biomechanical',
    'trash-polka',
];
export const SIZE_CM_MIN = 1;
export const SIZE_CM_MAX = 60;
const MAX_IMAGE_EDGE = 1024;
const MIN_IMAGE_EDGE = 256;
export function imageDimensionsForSize(widthCm, heightCm) {
    const longest = Math.max(widthCm, heightCm);
    const scale = MAX_IMAGE_EDGE / longest;
    const toPixels = (cm) => {
        const scaled = Math.round((cm * scale) / 32) * 32;
        return Math.min(MAX_IMAGE_EDGE, Math.max(MIN_IMAGE_EDGE, scaled));
    };
    return { width: toPixels(widthCm), height: toPixels(heightCm) };
}
export const STYLE_PROMPTS = {
    'line-art': 'fine line art, thin clean continuous outlines, no shading',
    'minimalist': 'minimalist, simple, few elements, lots of negative space',
    'geometric': 'geometric, precise symmetrical shapes, sacred geometry',
    'traditional': 'American traditional tattoo, bold black outlines, old school',
    'neo-traditional': 'neo-traditional tattoo, bold outlines, vivid saturated colors, decorative detail',
    'realistic': 'realistic, detailed shading, fine gradients, lifelike',
    'blackwork': 'blackwork tattoo, solid black ink, high contrast silhouettes',
    'dotwork': 'dotwork tattoo, stippling and pointillism shading',
    'tribal': 'tribal tattoo, bold curved black shapes, polynesian inspired',
    'watercolor': 'watercolor tattoo, soft color splashes and paint drips',
    'japanese': 'Japanese irezumi tattoo, bold outlines, waves and traditional motifs',
    'new-school': 'new school tattoo, cartoonish, exaggerated proportions, bright colors',
    'sketch': 'sketch style tattoo, loose hand-drawn pencil strokes, sketchy lines',
    'ornamental': 'ornamental tattoo, decorative filigree, lace and mandala patterns',
    'surrealism': 'surrealist tattoo, dreamlike imagery, impossible melting composition',
    'engraving': 'engraving tattoo, etching style, fine parallel hatching lines',
    'biomechanical': 'biomechanical tattoo, fused machine and organic anatomy, 3D depth',
    'trash-polka': 'trash polka tattoo, black and red, collage of realism and abstract strokes',
};
export const STYLE_EXAMPLES = {
    'line-art': 'a single rose with a long thorny stem',
    'minimalist': 'a tiny mountain peak with two triangles',
    'geometric': 'a stag head built from triangles and polygons',
    'traditional': 'a flying swallow with a banner ribbon',
    'neo-traditional': 'a fox portrait surrounded by peonies',
    'realistic': 'a photorealistic tiger portrait',
    'blackwork': 'a raven with spread wings in solid black',
    'dotwork': 'a sacred-geometry mandala built from stippled dots',
    'tribal': 'a polynesian-style sea turtle',
    'watercolor': 'a hummingbird with loose colourful paint splashes',
    'japanese': 'a koi fish swimming through curling waves',
    'new-school': 'a cartoon shark with bubbles in vivid colours',
    'sketch': 'a wild horse head drawn in loose pencil strokes',
    'ornamental': 'an ornate elephant decorated with filigree patterns',
    'surrealism': 'a melting pocket watch draped over a tree branch',
    'engraving': 'a tall sailing ship on stormy seas with fine hatching',
    'biomechanical': 'a robotic skeletal arm with cables and pistons',
    'trash-polka': 'a human-eye portrait combined with red brush strokes and torn paper',
};
//# sourceMappingURL=tattoo_options.js.map