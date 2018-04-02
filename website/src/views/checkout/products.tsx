import * as React from 'react';
import { Product, ProductType, products } from 'gif-slice-shared';

interface ProductListProps {
    selectedProduct: ProductType
    onDidChangeProduct: (newProduct: Product) => void
}

export class ProductList extends React.Component<ProductListProps> {
    render() {
        const listings = Array.from(products.values()).map(product =>
            <ProductListing
                key={product.type}
                product={product}
                defaultChecked={this.props.selectedProduct === product.type}
                onChange={product => this.onSelect(product)} />)

        return (
            <div className='product-listings'>
                {listings}
            </div>
        )
    }

    private onSelect(product: Product) {
        this.props.onDidChangeProduct(product)
    }
}

export interface ProductProps {
    product: Product

    defaultChecked: boolean

    onChange: (product: Product) => void
}

class ProductListing extends React.Component<ProductProps> {
    render() {
        const active = this.props.defaultChecked

        return (
            <div className={'product-listing ' + (active ? 'active' : '')} onClick={() => this.props.onChange(this.props.product)}>
                <h2 className='product-title'>{this.props.product.title}</h2>

                <div className='product-info'>
                    <p>{this.props.product.description}</p>
                </div>
                <div className='product-select'>
                    <div className='product-price'>{toPrice(this.props.product.baseCost)}</div>
                    <div className='plus-shipping'>plus shipping</div>
                    <div className='selected'>{active ? 'Selected' : '\xa0'}</div>
                </div>
            </div>
        )
    }
}

const toPrice = (value: number) =>
    '$' + value;