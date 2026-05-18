export function presentTattoo(tattoo) {
    return {
        id: tattoo.id,
        bodyPart: tattoo.bodyPart,
        style: tattoo.style,
        widthCm: tattoo.widthCm,
        heightCm: tattoo.heightCm,
        description: tattoo.description,
        imageUrl: `/api/tattoos/images/${tattoo.imagePath}`,
        width: tattoo.width,
        height: tattoo.height,
        seed: tattoo.seed,
        createdAt: tattoo.createdAt.toISO(),
    };
}
//# sourceMappingURL=tattoo_presenter.js.map