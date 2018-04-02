import * as React from 'react';
import * as THREE from 'three';

import { PreviewCube } from './preview_cube';
import { SliceRenderer } from '../../components/slice_renderer';
import { Sample } from '../../3d_renderer';

interface SliceSectionProps {
    imageData: any;
}

interface SliceSectionState {
    sample?: Sample;
}

const sampleSize = 256

export class SliceSection extends React.Component<SliceSectionProps, SliceSectionState> {
    constructor(props: SliceSectionProps) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <div className='how-it-works-section how-it-works-slice-section'>
                <h2 className="how-it-works-header">
                    <img src="/images/slice-header.svg" width="200px" />
                </h2>
                <div className='how-it-works-body'>
                    <div className='how-it-works-step'>
                        <PreviewCube
                            imageData={this.props.imageData}
                            initialPlanePosition={new THREE.Vector3(0, 1, 0)}
                            modifyPlane={this.modifyPlane.bind(this)}
                            onSampleDidChange={sample => this.onSampleDidChange(sample)}
                            sampleWidth={sampleSize}
                            sampleHeight={sampleSize} />
                        <p>Move a plane through the image cube...</p>
                    </div>
                    <div className='how-it-works-step'>
                        {this.state.sample && <SliceRenderer
                            sample={this.state.sample}
                            sampleWidth={sampleSize}
                            sampleHeight={sampleSize}
                            hideControls={true}
                        />}
                        <p>... to create a 2D slice of your gif</p>
                    </div>
                </div>
            </div>
        );
    }

    private onSampleDidChange(sample: Sample) {
        this.setState({ sample: sample })
    }

    modifyPlane(plane: THREE.Object3D, _elapsed: number) {
        const s = Math.sin(Date.now() / 1000)
        plane.position.copy(new THREE.Vector3(0, s, 0));
    }
}
