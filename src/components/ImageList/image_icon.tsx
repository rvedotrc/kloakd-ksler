import * as React from 'react';
import {DBEntry, ImageFileGroup} from "../../types";
import ImageLoader from "./image_loader";

type Props = {
    sha: string;
    entry: ImageFileGroup;
    dbEntry: DBEntry;
};

class ImageIcon extends React.Component<Props, never> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <ImageLoader
                sha={this.props.sha}
                entry={this.props.entry}
                preferredThumbnail="200x200"
                render={({src, widthAndHeight}) => {
                    if (!src) return "...";
                    if (!widthAndHeight) return "....";

                    const imageDownloadUrl = src;
                    const safeNaturalWidth = widthAndHeight.width;
                    const safeNaturalHeight = widthAndHeight.height;

                    const smallerDimension = (safeNaturalWidth < safeNaturalHeight)
                        ? safeNaturalWidth : safeNaturalHeight;

                    const degreesRotation = 1 * (this.props.dbEntry.rotateDegrees || 0);

                    const tags: Set<string> = new Set(this.props.dbEntry.tags);

                    const desiredSize = 100;
                    const scaleBy = desiredSize / smallerDimension;
                    const clipperId = "clipper-" + this.props.sha;

                    if ((tags.has('shape:circle') || tags.has('shape:square') || tags.has('shape:circleinsquare')) && !tags.has('multiple')) {
                        const scaledDesiredSize = desiredSize * this.props.dbEntry.radiusRatio * 2;
                        const isCircle = tags.has('shape:circle');

                        return (
                            <div className="imageIcon">
                                <p className="imageText">{this.props.dbEntry.text || ''}</p>
                                <p className="imageTags">{(this.props.dbEntry.tags || []).join(' ')}</p>

                                <svg className="imageThumbnail shapeSquare"
                                     width={desiredSize} height={desiredSize}
                                     viewBox={`-${desiredSize / 2} -${desiredSize / 2} ${desiredSize} ${desiredSize}`}
                                     xmlnsXlink="http://www.w3.org/1999/xlink"
                                >
                                    <defs>
                                        <clipPath id={clipperId}>
                                            {isCircle && (
                                                <circle cx="0" cy="0" r={scaledDesiredSize / 2}/>
                                            )}
                                            {!isCircle && (
                                                <rect x={-scaledDesiredSize / 2} y={-scaledDesiredSize / 2} width={scaledDesiredSize} height={scaledDesiredSize}/>
                                            )}
                                        </clipPath>
                                    </defs>

                                    <g transform={`rotate(${degreesRotation})`}>
                                        <g clipPath={`url(#${clipperId})`}>
                                            <g transform={`scale(${scaleBy}) translate(-${safeNaturalWidth * this.props.dbEntry.centerXRatio} -${safeNaturalHeight * this.props.dbEntry.centerYRatio})`}>
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
                    const style: React.CSSProperties = {transform};

                    return (
                        <div className="imageIcon">
                            <p className="imageText">{this.props.dbEntry.text || ''}</p>
                            <p className="imageTags">{(this.props.dbEntry.tags || []).join(' ')}</p>
                            {/*<code>{JSON.stringify(this.props.dbData)}</code>*/}
                            <img className="imageThumbnail shapeOther" style={style} src={imageDownloadUrl}/>
                        </div>
                    );
                }}
            />
        );
    }

}

export default ImageIcon;
