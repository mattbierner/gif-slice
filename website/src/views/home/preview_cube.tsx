import * as React from 'react';
import * as THREE from 'three';
import { CubeRenderer, Sample } from '../../3d_renderer';
import { GifRenderer } from '../../components/gif_renderer';


interface PreviewCubeProps {
    imageData: any;
    initialPlanePosition: THREE.Vector3;
    sampleWidth: number;
    sampleHeight: number;

    modifyPlane?: (plane: THREE.Object3D, elapsed: number) => void;

    onSampleDidChange?: (sample: Sample) => void;
}

export class PreviewCube extends React.Component<PreviewCubeProps> {
    private _renderer?: CubeRenderer;
    private _animating = false;
    private _lastUpdateTime: number | undefined;

    componentDidMount() {
        if (this.modifyPlane) {
            this._animating = true
            this._lastUpdateTime = Date.now()
            requestAnimationFrame(() => { this.modifyPlane() })
        }
    }

    componentWillUnmount() {
        this._animating = false
    }

    render() {
        return (
            <div className='preview-cube'>
                <GifRenderer
                    imageData={this.props.imageData}
                    sampleWidth={this.props.sampleWidth}
                    sampleHeight={this.props.sampleHeight}
                    delegate={{
                        onSampleDidChange: this.props.onSampleDidChange,
                    }}
                    renderer={renderer => { this._renderer = renderer }}
                    rendererOptions={{
                        enableControls: false,
                        initialPlanePosition: this.props.initialPlanePosition
                    }} />
            </div>
        )
    }

    private modifyPlane() {
        if (!this._renderer || !this.props.modifyPlane || !this._animating) {
            return;
        }

        const previousUpdate = this._lastUpdateTime;
        this._lastUpdateTime = Date.now()

        const elapsed = this._lastUpdateTime - previousUpdate!;
        this._renderer.modifyPlane((plane: THREE.Object3D) => {
            this.props.modifyPlane!(plane, elapsed)
        })

        requestAnimationFrame(() => { this.modifyPlane() })
    }
}