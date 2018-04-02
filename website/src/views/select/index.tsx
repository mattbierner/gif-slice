import * as React from 'react';
import Dropzone, { ImageFile } from 'react-dropzone';
import { LoadingSpinner } from '../../components/loading_spinner';
import { Gif, decodeGif, loadGif } from '../../load_gif';
import Search from './search';
import { SiteFooter } from '../../components/footer';


interface SelectViewProps {
    onDidSelectGif: (gif: Gif) => void
}

interface SelectViewState {
    dropzoneActive: boolean
    showingPicker: boolean

    loadingGif: boolean
    error?: string
}

export class SelectView extends React.Component<SelectViewProps, SelectViewState> {
    constructor(props: SelectViewProps) {
        super(props);
        this.state = {
            dropzoneActive: false,
            showingPicker: false,
            loadingGif: false
        }
    }

    render() {
        const { dropzoneActive } = this.state;
        const overlayStyle: any = {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            padding: '2.5em 0',
            background: 'rgba(0,0,0,0.5)',
            textAlign: 'center',
            color: '#fff'
        };
        return (
            <Dropzone
                className='window-dropzone'
                multiple={false}
                accept='image/gif'
                disableClick={true}
                disabled={this.state.loadingGif}
                onDrop={this.onDrop.bind(this)}
                onDragEnter={this.onDragEnter.bind(this)}
                onDragLeave={this.onDragLeave.bind(this)}
            >
                {dropzoneActive && <div style={overlayStyle}>Drop gif...</div>}
                <div className="page select-page">
                    <div className='select-options'>
                        <Dropzone
                            multiple={false}
                            accept="image/gif"
                            className='upload-button'
                            disabled={this.state.loadingGif}
                            onDrop={(accepted: ImageFile[]) => this.onDrop(accepted)}>
                            <i className='material-icons'>file_upload</i>
                            <span>Upload</span>
                        </Dropzone>
                        <button
                            className='search-button'
                            disabled={this.state.loadingGif}
                            onClick={() => this.onClick()}>
                            <img src="/images/giphy-logo.svg" />
                            Giphy
                    </button>
                    </div>
                    <p>Select your gif</p>
                    {this.state.error && <div className='error-message'>{this.state.error}</div>}

                    <LoadingSpinner active={this.state.loadingGif} />
                </div>

                <div className='spacer' />

                <SiteFooter />

                <Search
                    title={'Search Giphy'}
                    onGifSelected={this.onGifSelected.bind(this)}
                    visible={this.state.showingPicker}
                    onDismiss={this.onDismiss.bind(this)} />
            </Dropzone>
        );
    }

    private onGifSelected(src: string) {
        this.setState({
            showingPicker: false,
            loadingGif: true,
            error: undefined
        })

        loadGif(src)
            .then(gif => {
                this.setState({
                    loadingGif: false
                })
                this.props.onDidSelectGif(gif)
            })
            .catch(e => {
                console.error(e);
                this.setState({
                    loadingGif: false,
                    error: 'Could not load gif'
                })
            });
    }

    private onClick() {
        this.setState({
            showingPicker: true,
            error: undefined
        })
    }

    private onDismiss() {
        this.setState({ showingPicker: false })
    }

    private onDrop(accepted: ImageFile[]) {
        if (accepted.length) {
            this.setState({
                dropzoneActive: false,
                loadingGif: true,
                error: undefined
            });

            const fileReader = new FileReader();
            fileReader.onload = (event) => {
                const gif = decodeGif(new Uint8Array((event.target as any).result as ArrayBuffer));
                this.setState({
                    loadingGif: false
                })
                this.props.onDidSelectGif(gif);
            };

            fileReader.onerror = (e) => {
                console.error(e);
                this.setState({
                    loadingGif: false,
                    error: 'Could not read gif'
                });
            }

            fileReader.readAsArrayBuffer(accepted[0]);
        } else {
            this.setState({
                dropzoneActive: false,
                loadingGif: false,
                error: 'Invalid file. Please select a gif.'
            });
        }
    }

    private onDragEnter() {
        this.setState({
            dropzoneActive: true
        });
    }

    private onDragLeave() {
        this.setState({
            dropzoneActive: false
        });
    }
}
