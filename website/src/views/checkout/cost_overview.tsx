import * as React from 'react'
import { serverProductCoster } from '../../services/extraCostComputer';
import { Order } from '../../model/order';
import { Address } from 'gif-slice-shared';
import { LoadingSpinner } from '../../components/loading_spinner'

enum CostComputingStage {
    Initial,
    Calculating,
    Calculated
}

interface CostOverviewProps {
    readonly order: Order
    readonly address: Address;

    readonly onDidUpdate: (updatedOrder: Order) => void
}

interface CostOverviewState {
    stage: CostComputingStage
    error?: string;
}

export class CostOverview extends React.Component<CostOverviewProps, CostOverviewState> {
    constructor(props: CostOverviewProps) {
        super(props);
        this.state = {
            stage: CostComputingStage.Initial
        }
    }

    componentWillReceiveProps(newProps: CostOverviewProps) {
        if (this.props.order !== newProps.order) {
            this.setState({
                stage: newProps.order.hasComputedTotalCost ? CostComputingStage.Calculated : CostComputingStage.Initial,
                error: undefined
            });
        }
    }

    render() {
        if (this.state.stage !== CostComputingStage.Calculated) {
            return (
                <div className='cost-overview'>
                    <button
                        disabled={!this.props.address.isPotentiallyValid || this.state.stage !== CostComputingStage.Initial}
                        onClick={(e) => { e.preventDefault(); this.calculateShipping() }}
                        className='big-button'
                    >{this.state.stage === CostComputingStage.Calculating ? 'Computing Shipping Cost ' : 'Calculate Shipping Cost'}<LoadingSpinner active={this.state.stage === CostComputingStage.Calculating} /></button>

                    {this.state.error && <div className='error-message'>{this.state.error}</div>}
                </div>
            )
        }

        const totalCost = this.props.order.product.baseCost + (this.props.order.shippingCost || 0) + (this.props.order.taxCost || 0)
        return (
            <div className='cost-overview'>
                <div className='cost-line-items'>
                    <LineItem label={this.props.order.product.title} value={this.props.order.product.baseCost} />
                    <LineItem label={'Shipping'} value={this.props.order.shippingCost!} />
                    <LineItem label={'Tax'} value={this.props.order.taxCost!} />
                    <div className='cost-divider' />
                    <LineItem label='Total' className='total-cost' value={totalCost} />
                </div>
            </div>
        )
    }

    private async calculateShipping(): Promise<void> {
        this.setState({
            stage: CostComputingStage.Calculating,
            error: undefined
        })

        try {
            const costedOrder = await serverProductCoster.computeCosts(this.props.order, this.props.address);
            this.setState({ stage: CostComputingStage.Calculated })
            this.props.onDidUpdate(costedOrder)
        } catch (e) {
            this.setState({
                stage: CostComputingStage.Initial,
                error: 'Error computing costs. Please try again'
            })
        }
    }
}

const LineItem = (props: { label: string, value: number, className?: string }) =>
    <div className={'cost-line-item ' + (props.className || '')}>
        <span className='cost-line-item-label'>{props.label}</span> <span className='cost-line-item-value'>${props.value}</span>
    </div >

