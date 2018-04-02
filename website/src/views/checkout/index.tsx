import { Sample, CubeRenderer } from '../../3d_renderer';
import * as React from 'react';
import { Elements, ReactStripeElements, StripeProvider, injectStripe } from 'react-stripe-elements';
import { SlicePreview } from '../../components/slice_preview';
import { ShippingForm } from './address';
import { CostOverview } from './cost_overview';
import { PaymentSection } from './payment_section';
import { ProductList } from './products';
import { Order } from '../../model/order';
import { products, Address } from 'gif-slice-shared';
import { Gif } from '../../load_gif';
import { SiteFooter } from '../../components/footer';
import * as config from '../../config';

interface CheckoutViewProps {
    gif: Gif
    sample: Sample

    onDidOrder: (orderId: string) => void
}

interface CheckoutViewState {
    order: Order
    address: Address
    email: string;
    fullSizeSample: Sample;
    base64UploadData: string;
}


export class CheckoutView extends React.Component<CheckoutViewProps, CheckoutViewState> {
    constructor(props: CheckoutViewProps) {
        super(props)
        this.state = {
            order: Order.forProduct(Array.from(products.values())[0]),
            address: Address.empty,
            email: '',
            fullSizeSample: props.sample,
            base64UploadData: ''
        }
    }

    componentWillMount() {
        if (this.props.sample) {
            this.updateFullSample(this.props.sample);
        }
    }

    componentWillReceiveProps(newProps: CheckoutViewProps) {
        if (this.props.sample !== newProps.sample) {
            this.updateFullSample(newProps.sample);
        }
    }

    render() {
        return (
            <StripeProvider apiKey={config.stipePublicKey}>
                <Elements>
                    <div>
                        <div className='page checkout-page'>
                            <SlicePreview
                                backButtonTitle='Return to Checkout'
                                sample={this.state.fullSizeSample}
                                hideControls={true} />
                            <CheckoutForm
                                order={this.state.order}
                                onDidOrder={this.props.onDidOrder}
                                address={this.state.address}
                                onUpdateOrder={newOrder => this.updateOrder(newOrder)}
                                onUpdateAddress={newAddress => this.updateAddress(newAddress)}
                                base64UploadData={this.state.base64UploadData}
                                email={this.state.email}
                                onUpdateEmail={newEmail => { this.setState({ email: newEmail }) }}
                            />
                        </div>
                        <div className='spacer' />
                        <SiteFooter />
                    </div>
                </Elements>
            </StripeProvider>
        )
    }

    private updateOrder(newOrder: Order) {
        this.setState({
            order: newOrder
        })
    }

    private updateAddress(newAddress: Address) {
        this.setState({
            address: newAddress,
            order: Order.forProduct(this.state.order.product) // reset costs
        })
    }

    private updateFullSample(sample: Sample) {
        const fullSample = getFullSizeSample(this.props.gif, this.props.sample);
        this.setState({ fullSizeSample: fullSample })

        const canvas = document.createElement('canvas');
        canvas.width = fullSample.data.width
        canvas.height = fullSample.data.height

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get ctx');
        }

        ctx.putImageData(fullSample.data, 0, 0);

        let out = canvas.toDataURL();
        if (!out.startsWith('data:image/png;base64,')) {
            throw new Error('Could not get ctx');
        }

        this.setState({
            fullSizeSample: fullSample,
            base64UploadData: out.replace(/^data:image\/png;base64,/, '')
        });
    }
}


interface CheckoutFormProps {
    onUpdateOrder: (order: Order) => void
    onUpdateAddress: (address: Address) => void

    onUpdateEmail: (email: string) => void

    order: Order
    address: Address
    base64UploadData: string
    email: string

    onDidOrder: (orderId: string) => void
}

interface CheckourFromState {
    orderError?: string;
    submitting: boolean;
}

const CheckoutForm = injectStripe(class extends React.Component<CheckoutFormProps, CheckourFromState> {
    constructor(props: CheckoutFormProps) {
        super(props)
        this.state = {
            submitting: false
        }
    }

    render() {
        return (
            <form onSubmit={e => this.onSubmit(e)}>
                <SectionHeader
                    title='Printing'
                    blurb='How you would like your gif slice?'
                    details={<span>(see <a href='/faq.html' target='_blank'>faq</a> for more info)</span>} />

                <ProductList
                    selectedProduct={this.props.order.product.type}
                    onDidChangeProduct={product => this.props.onUpdateOrder(Order.forProduct(product))} />

                <SectionHeader
                    title='Shipping'
                    blurb='Where should we ship your gif slice?'
                    details='(currently United States only)' />

                <ShippingForm
                    address={this.props.address}
                    onChange={this.props.onUpdateAddress} />

                <div className={this.props.address.isPotentiallyValid ? 'fadeIn' : 'hidden'}>
                    <SectionHeader title='Checkout' />

                    <CostOverview
                        order={this.props.order}
                        address={this.props.address}
                        onDidUpdate={this.props.onUpdateOrder} />

                    <PaymentSection
                        order={this.props.order}
                        address={this.props.address}
                        email={this.props.email}
                        onUpdateEmail={this.props.onUpdateEmail}
                        lastOrderError={this.state.orderError}
                        inProgress={this.state.submitting} />
                </div>
            </form>
        )
    }

    private async onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
        this.setState({
            orderError: undefined,
            submitting: true
        });

        e.preventDefault();
        let token: stripe.Token | undefined;
        try {
            const response = await this.stripe.createToken();
            token = response.token;
        } catch {
            this.setState({
                orderError: 'Error requesting payment token',
                submitting: false,
            });
            return;
        }

        if (token) {
            await this.doSubmit(token);
        } else {
            this.setState({
                orderError: 'Checkout error. Please check payment method',
                submitting: false
            })
        }
    }

    private get stripe(): ReactStripeElements.StripeProps {
        return (this.props as any).stripe
    }

    private async doSubmit(token: stripe.Token) {
        try {
            const orderResponse = await fetch(config.orderEndpoint, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: this.props.base64UploadData,
                    address: this.props.address.toJson(),
                    product: this.props.order.product.type,
                    email: this.props.email,

                    stripeToken: token.id,

                    // Validate all costs server side :)
                    expectedCosts: {
                        base: this.props.order.product.baseCost,
                        tax: this.props.order.taxCost,
                        shipping: this.props.order.shippingCost,
                        total: this.props.order.totalCost
                    }
                })
            })

            const result = await orderResponse.json();
            if (!orderResponse.ok) {
                this.setState({
                    orderError: result.error || 'An error occurred while placing your order. Your card has not been charged.',
                    submitting: false
                })
                return;
            }

            this.props.onDidOrder(result.orderId)
            this.setState({
                orderError: '',
                submitting: false
            });
        } catch {
            this.setState({
                orderError: 'An error occurred while placing your order. Your card has not been charged.',
                submitting: false
            })
        }
    }
})

const SectionHeader = (props: { title: string, blurb?: string, details?: JSX.Element | string }) =>
    <div className='section-header'>
        <h1>{props.title}</h1>
        {props.blurb && <p>{props.blurb}</p>}
        {props.details && <p className='details'>{props.details}</p>}
    </div>


const getFullSizeSample = (gif: Gif, sample: Sample): Sample => {
    const canvas = document.createElement('canvas')
    const renderer = new CubeRenderer(canvas, canvas, {},
        {
            initialPlaneTransform: sample.planeTransform,
            enableControls: false
        });

    renderer.setGif(gif);

    const out = renderer.doSlice(renderer._plane, 2048, 2048);
    renderer.dispose();
    return out!;
}