import * as React from 'react';
import * as THREE from 'three';

import { PreviewCube } from './preview_cube';
import { SliceRenderer } from '../../components/slice_renderer';

interface PrintSectionProps {
    imageData: any;
}
interface PrintSectionState {
    sample?: any;
}

const sampleSize = 256;

export class PrintSection extends React.Component<PrintSectionProps, PrintSectionState> {
    constructor(props: PrintSectionProps) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <div className='how-it-works-section how-it-works-print-section'>
                <h2 className="how-it-works-header">
                    <img src="/images/print-header.svg" width="200px" />
                </h2>
                <div className='how-it-works-body'>
                    <div className='how-it-works-step'>
                        <PreviewCube
                            imageData={this.props.imageData}
                            initialPlanePosition={new THREE.Vector3(0, 0, 0)}
                            modifyPlane={this.modifyPlane.bind(this)}
                            sampleWidth={sampleSize}
                            sampleHeight={sampleSize}
                            onSampleDidChange={this.onSampleDidChange.bind(this)} />
                        <p>Once you find the perfect slice...</p>
                    </div>
                    <div className='how-it-works-step'>
                        {this.state.sample && <SliceRenderer
                            sample={this.state.sample}
                            sampleWidth={sampleSize}
                            sampleHeight={sampleSize}
                            hideControls={true}
                            hideBorder={true}
                        />}
                        <p>... checkout and recieve a custom 12x12 print on poster paper</p>
                    </div>
                </div>
            </div>
        );
    }

    private onSampleDidChange(imageData: any) {
        this.setState({ sample: imageData })
    }

    private modifyPlane(plane: THREE.Object3D, elapsed: number) {
        const rate = (0.5 / 1000) * (elapsed)
        plane.rotateY(rate);
        plane.rotateX(rate);
    }
}
