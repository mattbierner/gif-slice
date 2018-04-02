import { Address } from "gif-slice-shared";
import * as config from "../config";
import { Order } from "../model/order";

export interface ExtraCostComputer {
    computeCosts(
        order: Order,
        shippingAddress: Address
    ): Promise<Order>;
}

export const serverProductCoster = new class implements ExtraCostComputer {
    async computeCosts(
        order: Order,
        shippingAddress: Address
    ): Promise<Order> {
        const result = await fetch(config.calculateShippingAndTaxEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                address: shippingAddress.toJson(),
                variant: order.product.type
            })
        })

        const body = await result.json();

        return order
            .withShippingOptions(body.shipping.map((x: any) => {
                x.rate = +x.rate;
                return x;
            }), 0)
            .withTaxRate(+body.taxRate);
    }
}
