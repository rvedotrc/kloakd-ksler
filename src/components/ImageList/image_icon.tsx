import * as React from 'react';
import {DBEntry, ImageFileGroup} from "../../types";

declare const firebase: typeof import('firebase');

type Props = {
    sha: string;
    entry: ImageFileGroup;
    dbEntry: DBEntry;
};

type State = {
    imageDownloadUrl?: string;
    usingThumbnail?: boolean;
    isMounted: boolean;
};

class ImageIcon extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            isMounted: true,
        };
    }

    componentDidMount() {
        const entry = this.props.entry;

        try {
            const thumbnailPath = entry.thumbnails.get('200x200')?.path;
            const fullPath = thumbnailPath || entry.main?.metadata?.fullPath;
            if (!fullPath) throw 'No thumbnail and no main';

            const usingThumbnail = !!thumbnailPath;

            const reference = firebase.storage().ref(fullPath);

            reference.getDownloadURL()
                .then(imageDownloadUrl => {
                    this.state.isMounted && this.setState({ imageDownloadUrl, usingThumbnail });
                })
                .catch(error => console.log({error}));
        } catch(e) {
            console.log({ e });
        }
    }

    componentWillUnmount(): void {
        this.setState({ isMounted: false });
    }

    render() {
        if (!this.state) return "...";

        const { imageDownloadUrl, usingThumbnail } = this.state;
        if (!imageDownloadUrl) return "...";

        const transform = `rotate(${1 * (this.props.dbEntry.rotateDegrees || 0)}deg)`;
        const style: React.CSSProperties = { transform };

        if (!usingThumbnail) {
            style.width = '200px';
            style.height = '200px';
            style.border = '1px solid red';
        }

        return (
            <div>
                <p className="imageText">{this.props.dbEntry.text || ''}</p>
                <p className="imageTags">{(this.props.dbEntry.tags || []).join(' ')}</p>
                {/*<code>{JSON.stringify(this.props.dbData)}</code>*/}
                <img style={style} src={imageDownloadUrl}/>
            </div>
        );
    }

}

export default ImageIcon;
