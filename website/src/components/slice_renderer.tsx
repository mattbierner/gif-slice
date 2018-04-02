import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Sample } from '../3d_renderer';

interface SliceRendererProps {
    hideControls?: boolean
    sampleWidth: number;
    sampleHeight: number;
    sample?: Sample;
    className?: string;

    hideBorder?: boolean;
}

export class SliceRenderer extends React.PureComponent<SliceRendererProps> {
    private _2dCanvas?: HTMLCanvasElement;
    private _ctx?: CanvasRenderingContext2D | null;

    componentDidMount() {
        const element = ReactDOM.findDOMNode(this);

        this._2dCanvas = element.getElementsByClassName('slice-canvas')[0] as HTMLCanvasElement;
        this._ctx = this._2dCanvas!.getContext('2d');
        this.redraw(this.props.sample)
    }

    componentWillReceiveProps(newProps: SliceRendererProps) {
        this.redraw(newProps.sample)
    }

    render() {
        return (
            <div className={'slice-container ' + (this.props.className || '')}>
                <canvas className='slice-canvas' width='200' height='200' />
                {!this.props.hideControls && this.props.sample &&
                    <div className='slice-properties'>
                        <span className='property'>Slice Size: <span className='value'>{this.props.sample.planeWidth.toFixed(2)} x {this.props.sample.planeHeight.toFixed(2)}</span></span>
                    </div>
                }
            </div>
        )
    }

    private redraw(sample: Sample | undefined) {
        if (!this._ctx || !this._2dCanvas) {
            return;
        }

        if (sample) {
            this._2dCanvas.width = sample.data.width;
            this._2dCanvas.height = sample.data.height;
            this._ctx.putImageData(sample.data, 0, 0);
        } else {
            this._ctx.clearRect(0, 0, this._2dCanvas.width, this._2dCanvas.height)
        }

        if (!this.props.hideBorder) {
            // Draw outline
            this._ctx.rect(0, 0, this._2dCanvas.width, this._2dCanvas.height);
            this._ctx.stroke();
        }
    }
}