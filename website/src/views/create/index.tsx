import * as React from 'react';
import { CubeRenderer, CubeRendererDelegate, Sample } from '../../3d_renderer';
import { GifRenderer } from '../../components/gif_renderer';
import { SlicePreview } from '../../components/slice_preview';
import { Gif } from '../../load_gif';


interface CreateViewProps {
    gif: Gif

    onSampleDidChange: (sample: Sample) => void

    initialPlaneTransform?: THREE.Matrix4;
}

interface CreateViewState {
    sample?: Sample
}

export class CreateView extends React.Component<CreateViewProps, CreateViewState> implements CubeRendererDelegate {
    private _renderer?: CubeRenderer;

    constructor(props: CreateViewProps) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <div className='gif-renderer'>
                <div className='three-container'>
                    <div className='three-controls three-view-controls'>
                        <button onClick={() => this._renderer!.goToFrontView()}>Front</button>
                        <button onClick={() => this._renderer!.goToSideView()}>Side</button>
                        <button onClick={() => this._renderer!.goToTopView()}>Top</button>
                        <button onClick={() => this._renderer!.resetCamera()}>Reset Camera</button>
                    </div>

                    <div className='three-obj-control-wrapper'>
                        <div className='three-controls three-obj-controls'>
                            <button onClick={() => this._renderer!.setTransformMode('translate')}>Translate (w) </button>
                            <button onClick={() => this._renderer!.setTransformMode('rotate')}>Rotate (e) </button>
                            <button onClick={() => this._renderer!.setTransformMode('scale')}>Scale (r) </button>
                            <button onClick={() => this._renderer!.resetPlane()}>Reset Plane</button>
                        </div>
                    </div>

                    <GifRenderer
                        imageData={this.props.gif}
                        sampleWidth={400}
                        sampleHeight={400}
                        delegate={this}
                        renderer={renderer => this._renderer = renderer}
                        rendererOptions={{
                            initialPlaneTransform: this.props.initialPlaneTransform,
                            enableControls: true
                        }} />
                </div>

                <SlicePreview
                    backButtonTitle='Continue Editing'
                    sample={this.state.sample} />
            </div>
        )
    }

    /**
     * Update 2d canvas when slices changes.
     */
    onSampleDidChange(sample: Sample) {
        this.setState({ sample: sample })
        this.props.onSampleDidChange(sample)
    }
}
