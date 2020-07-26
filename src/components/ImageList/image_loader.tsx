import * as React from 'react';

import {ImageFileGroup} from "../../types";
import ImageDownloader from "./image_downloader";

type WidthAndHeight = {
    width: number;
    height: number;
};

type RenderArgs = {
    src?: string;
    widthAndHeight?: WidthAndHeight;
};

type Props = {
    sha: string;
    entry: ImageFileGroup;
    preferredThumbnail: string;
    render: (args: RenderArgs) => React.ReactNode;
};

type State = {
    src: string;
    widthAndHeight: WidthAndHeight;
};

class ImageLoader extends React.Component<Props, State> {

    render() {
        const src = this.state?.src;
        const widthAndHeight = this.state?.widthAndHeight;

        return (
            <>
                <ImageDownloader
                    sha={this.props.sha}
                    entry={this.props.entry}
                    preferredThumbnail={this.props.preferredThumbnail}
                    onUrl={url => this.setState({ src: url })}
                    onNaturalSize={(width, height) => this.setState({ widthAndHeight: { width, height } })}
                />

                {this.props.render({ src, widthAndHeight })}
            </>
        );
    }

}

export default ImageLoader;
