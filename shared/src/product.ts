export enum ProductType {
    unknown = 'unknown',
    poster12x12 = 'poster12x12',
    framed12x12 = 'framed12x12',
    canvas12x12 = 'canvas12x12',
}

export namespace ProductType {
    export function fromString(value: string) {
        switch (value) {
            case ProductType.poster12x12:
                return ProductType.poster12x12;

            case ProductType.framed12x12:
                return ProductType.framed12x12;

            case ProductType.canvas12x12:
                return ProductType.canvas12x12;

            default:
                return ProductType.unknown;
        }
    }
}

export interface Product {
    readonly type: ProductType
    readonly title: string
    readonly description: string
    readonly baseCost: number;
    readonly code: string;

}

export const products = new Map<ProductType, Product>([
    [ProductType.poster12x12, {
        type: ProductType.poster12x12,
        title: '12x12 Matte Poster',
        description: '12 inch square poster printed on thick, high quality matte paper',
        baseCost: 16.00,
        code: '4464'
    }],
    [ProductType.framed12x12, {
        type: ProductType.framed12x12,
        title: '12x12 Framed Matte Poster',
        description: '12 inch square poster printed on museum-quality matte paper in a black wood frame. Mounting hardware included',
        baseCost: 34.00,
        code: '4653'
    }],

    // [ProductType.canvas12x12, {
    //     type: ProductType.canvas12x12,
    //     title: '12x12 Canvas Poster',
    //     description: '12 inch square poster printed on high quality canvas',
    //     baseCost: 40.00,
    //     code: '823'
    // }]
]);