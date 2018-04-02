import * as React from 'react'
import { CardElement } from 'react-stripe-elements';

import { CheckoutButton } from './checkout_button';
import { TextField } from 'material-ui';
import { Order } from '../../model/order';
import { Address } from 'gif-slice-shared';

interface PaymentSectionProps {
    email: string;
    order: Order
    address: Address
    lastOrderError?: string
    inProgress: boolean

    onUpdateEmail: (newEmail: string) => void
}

interface PaymentSectionState {
    error: stripe.Error | undefined

    hasValidCard: boolean
}

export class PaymentSection extends React.Component<PaymentSectionProps, PaymentSectionState> {

    constructor(props: PaymentSectionProps) {
        super(props);

        this.state = {
            error: undefined,
            hasValidCard: false
        }
    }

    render() {
        return (
            <div className={'payment-section ' + (!this.props.order.hasComputedTotalCost ? 'hidden' : '')}>
                <TextField
                    className='email-input'
                    required={true}
                    fullWidth
                    id='email'
                    type='email'
                    label='Email'
                    value={this.props.email}
                    autoComplete='email'
                    onChange={e => this.props.onUpdateEmail(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }} />

                <CardElement
                    className='card-input'
                    onChange={e => this.onCardChange(e)} />

                <CheckoutButton
                    order={this.props.order}
                    disabled={!this.state.hasValidCard || this.props.inProgress}
                    inProgress={this.props.inProgress} />

                {this.props.lastOrderError && <div className='error-message'>{this.props.lastOrderError}</div>}
            </div>
        )
    }

    private onCardChange(e: stripe.elements.ElementChangeResponse): any {
        if (e.error) {
            this.setState({
                hasValidCard: false,
                error: e.error
            })
            return
        }

        this.setState({
            error: undefined,
            hasValidCard: e.complete
        })
    }
}
