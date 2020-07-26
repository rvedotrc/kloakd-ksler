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

            const reference = firebase.storage().ref(fullPath);

            reference.getDownloadURL()
                .then(imageDownloadUrl => {
                    if (this.state.isMounted) {
                        this.setState({imageDownloadUrl});

                        const img = document.createElement("img");
                        img.addEventListener("load", () => {
                            this.setState({
                                naturalWidth: img.naturalWidth,
                                naturalHeight: img.naturalHeight,
                            });
                        });
                        img.setAttribute("src", imageDownloadUrl);
                    }
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

        const { imageDownloadUrl, naturalWidth, naturalHeight } = this.state;
        if (!imageDownloadUrl) return "...";

        if (!naturalWidth || !naturalHeight) {
            return "....";
        }

        const safeNaturalWidth = naturalWidth as number;
        const safeNaturalHeight = naturalHeight as number;
        const smallerDimension = (safeNaturalWidth < safeNaturalHeight)
            ? safeNaturalWidth : safeNaturalHeight;

        const degreesRotation = 1 * (this.props.dbEntry.rotateDegrees || 0);

        const tags: Set<string> = new Set(this.props.dbEntry.tags);

        const desiredSize = 100;
        const scaleBy = desiredSize / smallerDimension;
        const clipperId = "clipper-" + this.props.sha;

        if (tags.has('shape:circle') && !tags.has('multiple')) {
            return (
                <div className="imageIcon">
                    <p className="imageText">{this.props.dbEntry.text || ''}</p>
                    <p className="imageTags">{(this.props.dbEntry.tags || []).join(' ')}</p>

                    <svg className="imageThumbnail shapeCircle"
                        width={desiredSize} height={desiredSize}
                        viewBox={`-${desiredSize/2} -${desiredSize/2} ${desiredSize} ${desiredSize}`}
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                    >
                        <defs>
                            <clipPath id={clipperId}>
                                <circle cx="0" cy="0" r={desiredSize/2}/>
                            </clipPath>
                        </defs>

                        <g transform={`rotate(${degreesRotation})`}>
                            <g clipPath={`url(#${clipperId})`}>
                                <g transform={`scale(${scaleBy}) translate(-${safeNaturalWidth/2} -${safeNaturalHeight/2})`}>
                                    <image
                                        href={imageDownloadUrl}
                                        width={safeNaturalWidth}
                                        height={safeNaturalHeight}
                                    />
                                </g>
                            </g>
                        </g>
                    </svg>
                </div>
            );
        }

        if ((tags.has('shape:square') || tags.has('shape:circleinsquare')) && !tags.has('multiple')) {
            return (
                <div className="imageIcon">
                    <p className="imageText">{this.props.dbEntry.text || ''}</p>
                    <p className="imageTags">{(this.props.dbEntry.tags || []).join(' ')}</p>

                    <svg className="imageThumbnail shapeSquare"
                        width={desiredSize} height={desiredSize}
                        viewBox={`-${desiredSize/2} -${desiredSize/2} ${desiredSize} ${desiredSize}`}
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                    >
                        <defs>
                            <clipPath id={clipperId}>
                                <rect x={-desiredSize/2} y={-desiredSize/2} width={desiredSize} height={desiredSize}/>
                            </clipPath>
                        </defs>

                        <g transform={`rotate(${degreesRotation})`}>
                            <g clipPath={`url(#${clipperId})`}>
                                <g transform={`scale(${scaleBy}) translate(-${safeNaturalWidth/2} -${safeNaturalHeight/2})`}>
                                    <image
                                        href={imageDownloadUrl}
                                        width={safeNaturalWidth}
                                        height={safeNaturalHeight}
                                    />
                                </g>
                            </g>
                        </g>
                    </svg>
                </div>
            );
        }

        const transform = `rotate(${degreesRotation}deg)`;
        const style: React.CSSProperties = { transform };

        return (
            <div className="imageIcon">
                <p className="imageText">{this.props.dbEntry.text || ''}</p>
                <p className="imageTags">{(this.props.dbEntry.tags || []).join(' ')}</p>
                {/*<code>{JSON.stringify(this.props.dbData)}</code>*/}
                <img className="imageThumbnail shapeOther" style={style} src={imageDownloadUrl}/>
            </div>
        );
    }

}

export default ImageIcon;
