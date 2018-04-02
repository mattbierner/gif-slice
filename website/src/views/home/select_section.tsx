import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as THREE from 'three';

import { PreviewCube } from './preview_cube';


class Frame extends React.Component<{ imageData: any, i: number }> {
    _2dCanvas: any;
    _ctx: any;

    componentDidMount() {
        const element = ReactDOM.findDOMNode(this);
        this._2dCanvas = element
        this._ctx = this._2dCanvas.getContext('2d');
        this._2dCanvas.width = this.props.imageData.width;
        this._2dCanvas.height = this.props.imageData.height;
        this._ctx.putImageData(this.props.imageData.frames[this.props.i].data, 0, 0);
    }

    render() {
        return <canvas />
    }
}

interface CubeSectionProps {
    imageData: any;
    gif: string;
}
interface CubeSectionState {
    sample?: any;
}


const sampleSize = 256;

export class HowItWorksSelectSection extends React.Component<CubeSectionProps, CubeSectionState> {
    constructor(props: CubeSectionProps) {
        super(props)
        this.state = {}
    }

    render() {
        const frames = (index: number, skip: number): undefined | JSX.Element => {
            if (!this.props.imageData || index > this.props.imageData.frames.length) {
                return
            }

            return (
                <div className='gif-frame'>
                    <Frame imageData={this.props.imageData} i={index} />
                    {frames(index + skip, skip)}
                </div>
            )
        }

        return (
            <div className='how-it-works-section how-it-works-select-section'>
                <h2 className="how-it-works-header">
                    <img src="/images/select-header.svg" width="200px" />
                </h2>
                <div className='how-it-works-body'>
                    <div className='how-it-works-step'>
                        <img src={this.props.gif} />
                        <p>Upload a gif or select one from giphy.</p>
                    </div>
                    <div className='how-it-works-step cube-body-section'>
                        <div className='gif-frames-container'>
                            <div className='gif-frames'>
                                {frames(0, 16)}
                            </div>
                        </div>
                        <p>Gif slice breaks your gif into frames...</p>
                    </div>
                    <div className='how-it-works-step'>
                        <PreviewCube
                            imageData={this.props.imageData}
                            initialPlanePosition={new THREE.Vector3(0, 10, 0)}
                            sampleWidth={sampleSize}
                            sampleHeight={sampleSize} />
                        <p>... and connects the frames into a solid image cube</p>
                    </div>
                </div>
            </div>
        );
    }
}

