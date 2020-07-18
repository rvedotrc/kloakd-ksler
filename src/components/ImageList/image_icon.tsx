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
    naturalWidth?: number;
    naturalHeight?: number;
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

        const { imageDownloadUrl, usingThumbnail, naturalWidth, naturalHeight } = this.state;
        if (!imageDownloadUrl) return "...";

        if (!naturalWidth || !naturalHeight) {
            const img = document.createElement("img");
            img.addEventListener("load", () => {
                this.setState({
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                });
            });
            img.setAttribute("src", imageDownloadUrl);
            return "....";
        }

        const safeNaturalWidth = naturalWidth as number;
        const safeNaturalHeight = naturalHeight as number;

        const degreesRotation = 1 * (this.props.dbEntry.rotateDegrees || 0);

        if (this.props.dbEntry.tags.some(tag => tag === 'shape:circle')) {
            const desiredRadius = 100;
            const desiredSize = desiredRadius * 2;

            const clipperId = "clipper-" + this.props.sha;

            // Looks horrible though
            const scaleUp = (safeNaturalWidth < safeNaturalHeight)
                ? (safeNaturalHeight / safeNaturalWidth)
                : (safeNaturalWidth / safeNaturalHeight);

            return (
                <svg
                    width={desiredSize} height={desiredSize}
                    viewBox={`-${desiredRadius} -${desiredRadius} ${desiredSize} ${desiredSize}`}
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                >
                    <defs>
                        <clipPath id={clipperId}>
                            <circle cx="0" cy="0" r={desiredRadius}/>
                        </clipPath>
                    </defs>

                    <g clipPath={`url(#${clipperId})`}>
                        <image
                            href={imageDownloadUrl}
                            width={safeNaturalWidth}
                            height={safeNaturalHeight}
                            transform={`
                                scale(${scaleUp})
                                translate(-${safeNaturalWidth/2} -${safeNaturalHeight/2})
                                rotate(${degreesRotation} ${safeNaturalWidth/2} ${safeNaturalHeight/2})
                            `}
                        />
                    </g>
                </svg>
            );
        }

        const transform = `rotate(${degreesRotation}deg)`;
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
