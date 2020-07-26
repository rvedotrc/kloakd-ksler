import * as React from 'react';
import {DBEntry, ImageFileGroup} from "../../types";
import ImageDownloader from "./image_downloader";

type Props = {
    sha: string;
    entry: ImageFileGroup;
    dbEntry: DBEntry;
};

type State = {
    imageDownloadUrl: string;
    naturalWidth: number;
    naturalHeight: number;
};

class ImageIcon extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
    }

    renderImageDownloader() {
        return (
            <ImageDownloader
                sha={this.props.sha}
                entry={this.props.entry}
                dbEntry={this.props.dbEntry}
                preferredThumbnail="200x200"
                onUrl={imageDownloadUrl => this.setState({ imageDownloadUrl })}
                onNaturalSize={(naturalWidth, naturalHeight) => this.setState({ naturalWidth, naturalHeight })}
            />
        );
    }

    render() {
        const imageDownloadUrl = this.state?.imageDownloadUrl;
        const naturalWidth = this.state?.naturalWidth;
        const naturalHeight = this.state?.naturalHeight;

        if (!imageDownloadUrl || !naturalWidth || !naturalHeight) {
            return (
                <>
                    {this.renderImageDownloader()}
                    {imageDownloadUrl ? "...." : "..."}
                </>
            );
        }

        const safeNaturalWidth = naturalWidth;
        const safeNaturalHeight = naturalHeight;
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
                    {this.renderImageDownloader()}

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
                    {this.renderImageDownloader()}

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
                {this.renderImageDownloader()}

                <p className="imageText">{this.props.dbEntry.text || ''}</p>
                <p className="imageTags">{(this.props.dbEntry.tags || []).join(' ')}</p>
                {/*<code>{JSON.stringify(this.props.dbData)}</code>*/}
                <img className="imageThumbnail shapeOther" style={style} src={imageDownloadUrl}/>
            </div>
        );
    }

}

export default ImageIcon;
