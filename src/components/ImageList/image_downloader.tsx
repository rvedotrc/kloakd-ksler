import * as React from 'react';
import {ImageFileGroup} from "../../types";

declare const firebase: typeof import('firebase');

type Props = {
    sha: string;
    entry: ImageFileGroup;
    preferredThumbnail: string;
    onUrl: (imageDownloadUrl: string) => void;
    onNaturalSize: (width: number, height: number) => void;
};

type State = {
    lastFullPath: string;
    isUnmounted: boolean;
    imageDownloadUrl: string;
};

class ImageDownloader extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
    }

    private getFullPath(props: Props) {
        const entry = props.entry;

        const thumbnailPath = entry.thumbnails.get(this.props.preferredThumbnail)?.path;
        const fullPath = thumbnailPath || entry.main?.metadata?.fullPath;
        if (!fullPath) throw 'No thumbnail and no main';

        return fullPath;
    }

    private imageLoaded(imageElement: EventTarget & HTMLImageElement) {
        this.props.onNaturalSize(
            imageElement.naturalWidth,
            imageElement.naturalHeight,
        );
    }

    render() {
        const fullPath = this.getFullPath(this.props);
        const lastFullPath = this.state?.lastFullPath;

        if (fullPath !== lastFullPath) {
            const reference = firebase.storage().ref(fullPath);

            reference.getDownloadURL().then(imageDownloadUrl => {
                if (!this.state?.isUnmounted) {
                    this.setState((prevState, props) => {
                        const newFullPath = this.getFullPath(props);
                        if (fullPath === newFullPath) {
                            props.onUrl(imageDownloadUrl);
                            return {
                                lastFullPath: fullPath,
                                imageDownloadUrl,
                            };
                        } else {
                            return null;
                        }
                    });
                }
            });
        }

        const imageDownloadUrl = this.state?.imageDownloadUrl;
        if (!imageDownloadUrl) return null;

        return (
            <img
                style={{display: "none"}}
                src={imageDownloadUrl}
                onLoad={e => this.imageLoaded(e.currentTarget)}
            />
        );
    }

}

export default ImageDownloader;
