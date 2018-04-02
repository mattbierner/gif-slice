import * as React from 'react';
import { SiteFooter } from '../../components/footer';
import { Link } from 'react-router-dom';

interface SelectViewProps {
    placedOrderId: string
}

export class DoneView extends React.Component<SelectViewProps> {

    render() {
        return (
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                <div className="page select-page">
                    <h1>Thank you for your order!</h1>
                    <div><b>Your order id is:</b> {this.props.placedOrderId}</div>
                    <br />
                    <div>Questions or concerns? <a href='mailto:gifslice@gmail.com'>Contact Us</a></div>
                    <br />
                    <br />
                    <Link to='/select' style={{ margin: '0 auto' }} className='big-button-link'>Create Another Slice</Link>
                </div>

                <div className='spacer' />

                <SiteFooter />
            </div>
        );
    }
}
