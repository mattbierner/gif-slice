import { Product, ShippingMethod } from 'gif-slice-shared';

export class Order {
    public static forProduct(product: Product): Order {
        return new Order(product, undefined, undefined, undefined);
    }

    private constructor(
        public readonly product: Product,
        public readonly shippingOptions: ShippingMethod[] | undefined,
        public readonly selectedShippingOption: number | undefined,
        public readonly taxRate: number | undefined
    ) { }

    public get hasComputedTotalCost(): boolean {
        return typeof this.selectedShippingOption === 'number' && typeof this.taxRate === 'number'
    }

    public get totalCost(): number | undefined {
        if (!this.hasComputedTotalCost) {
            return undefined;
        }

        return this.product.baseCost + this.shippingCost! + this.taxCost!
    }

    public get shippingCost(): number | undefined {
        if (!this.shippingOptions || typeof this.selectedShippingOption === 'undefined') {
            return undefined;
        }

        return this.shippingOptions[this.selectedShippingOption].rate;
    }

    public get taxCost(): number | undefined {
        if (!this.hasComputedTotalCost) {
            return undefined;
        }
        const base = this.product.baseCost + this.shippingCost!;
        return base * this.taxRate!;
    }

    public withShippingOptions(options: ShippingMethod[], selected: number | undefined): Order {
        return new Order(this.product, options, selected, this.taxRate)
    }

    public withTaxRate(taxCost: number): Order {
        return new Order(this.product, this.shippingOptions, this.selectedShippingOption, taxCost)
    }
}