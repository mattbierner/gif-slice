import * as React from 'react';
import { Sample } from '../3d_renderer';
import { SliceRenderer } from "./slice_renderer";

interface SlicePreviewProps {
    backButtonTitle: string;
    sample?: Sample;
    hideControls?: boolean;
}

interface SlicePreviewState {
    isShowing: boolean
}

export class SlicePreview extends React.Component<SlicePreviewProps, SlicePreviewState> {
    private _keydownlistener?: (e: any) => void;

    constructor(props: SlicePreviewProps) {
        super(props);
        this.state = {
            isShowing: false
        }
    }

    componentDidMount() {
        this._keydownlistener = e => {
            if (!this.state.isShowing) {
                return
            }

            if (e.keyCode === 27) { // escape
                this.onDismiss();
            }
        };
        document.addEventListener('keydown', this._keydownlistener)
    }

    componentWillUnmount() {
        if (this._keydownlistener) {
            document.removeEventListener('keydown', this._keydownlistener);
        }
    }

    render() {
        return (
            <a className='slice-preview' onClick={this.state.isShowing ? () => { } : () => this.onClick()}>
                <SliceRenderer
                    className='inline-slice-container'
                    sample={this.props.sample}
                    sampleWidth={256}
                    sampleHeight={256}
                    hideControls={this.props.hideControls} />

                <div className='slice-preview-overlay' style={{ display: this.state.isShowing ? undefined : 'none' }}>
                    <div className='slice-preview-background' onClick={() => this.onDismiss()} />
                    <div className='slice-preview'>
                        <h1>Preview</h1>
                        <SliceRenderer
                            className='overlay-slice-container'
                            sample={this.props.sample}
                            sampleWidth={256}
                            sampleHeight={256}
                            hideControls={this.props.hideControls} />
                        <button onClick={(e) => { e.preventDefault(); this.onDismiss(); }}>{this.props.backButtonTitle}</button>
                    </div>
                </div>
            </a>
        )
    }

    private onClick() {
        this.setState({ isShowing: true })
    }

    private onDismiss() {
        this.setState({ isShowing: false })
    }
}