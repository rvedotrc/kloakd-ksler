import * as React from 'react';
import {DBEntry} from "../../types";
import {WidthAndHeight} from "./image_loader";

type Props = {
    src: string;
    widthAndHeight: WidthAndHeight;
    dbEntry: DBEntry;
    onChangeDBEntry: (dbEntry: DBEntry) => void;
    desiredSize: number;
};

type State = {};

class ImageWithGeometry extends React.Component<Props, State> {

    private getShape(): string | undefined {
        return this.props.dbEntry.tags.find(tag => tag.startsWith("shape:"))?.replace("shape:", "");
    }

    render() {
        const { width: imageWidth, height: imageHeight } = this.props.widthAndHeight;
        const smallerImageDimension = (imageWidth < imageHeight) ? imageWidth : imageHeight;

        const desiredSize = this.props.desiredSize;
        const viewBoxSize = desiredSize * Math.sqrt(2.0);

        const scaleBy = desiredSize / smallerImageDimension;

        const shape = this.getShape();

        if (shape === 'circle') {
            return (
                <svg className="imageThumbnail shapeNone"
                     width={viewBoxSize} height={viewBoxSize}
                     viewBox={`-${viewBoxSize / 2} -${viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`}
                     xmlnsXlink="http://www.w3.org/1999/xlink"
                >
                    <g transform={`rotate(${this.props.dbEntry.rotateDegrees})`}>
                        <g transform={`scale(${scaleBy}) translate(-${imageWidth * this.props.dbEntry.centerXRatio} -${imageHeight * this.props.dbEntry.centerYRatio})`}>
                            <image
                                href={this.props.src}
                                width={imageWidth}
                                height={imageHeight}
                            />

                            <circle
                                cx={imageWidth * this.props.dbEntry.centerXRatio}
                                cy={imageHeight * this.props.dbEntry.centerYRatio}
                                r={smallerImageDimension * this.props.dbEntry.radiusRatio}
                                fill={"none"}
                                stroke={"red"}
                            />
                            <circle
                                cx={imageWidth * this.props.dbEntry.centerXRatio}
                                cy={imageHeight * this.props.dbEntry.centerYRatio}
                                r={smallerImageDimension * this.props.dbEntry.radiusRatio}
                                fill={"none"}
                                stroke={"transparent"}
                                strokeWidth={100}
                                style={{cursor: "pointer"}}
                                onMouseDown={event => {
                                    const svg = (event.target as SVGCircleElement);
                                    if (!svg) return;
                                    if (!svg.ownerSVGElement) return;

                                    let screenCTM = svg.getScreenCTM();
                                    if (!screenCTM) return;

                                    const pt = svg.ownerSVGElement.createSVGPoint();
                                    pt.x = event.clientX;
                                    pt.y = event.clientY;

                                    // The cursor point, translated into svg coordinates
                                    const cursorPt =  pt.matrixTransform(screenCTM.inverse());

                                    const distanceFromCenter = Math.sqrt(
                                        (cursorPt.x - imageWidth * this.props.dbEntry.centerXRatio) ** 2
                                        +
                                        (cursorPt.y - imageHeight * this.props.dbEntry.centerYRatio) ** 2
                                    );

                                    const radiusRatio = distanceFromCenter / smallerImageDimension;

                                    this.props.onChangeDBEntry({
                                        ...this.props.dbEntry,
                                        radiusRatio,
                                    });
                                }}
                            />

                            <path d={`
                                M ${imageWidth * this.props.dbEntry.centerXRatio} ${imageHeight * this.props.dbEntry.centerYRatio}
                                m -100 0 l 200 0
                                m -100 -100 l 0 200
                            `} stroke={"red"}/>
                            <circle
                                cx={imageWidth * this.props.dbEntry.centerXRatio}
                                cy={imageHeight * this.props.dbEntry.centerYRatio}
                                r={50}
                                fill={"transparent"}
                                stroke={"red"}
                                onMouseDown={event => {
                                    const svg = (event.target as SVGCircleElement);
                                    if (!svg) return;
                                    if (!svg.ownerSVGElement) return;

                                    let screenCTM = svg.getScreenCTM();
                                    if (!screenCTM) return;

                                    const pt = svg.ownerSVGElement.createSVGPoint();
                                    pt.x = event.clientX;
                                    pt.y = event.clientY;

                                    // The cursor point, translated into svg coordinates
                                    const cursorPt =  pt.matrixTransform(screenCTM.inverse());
                                    // console.log("(" + cursorPt.x + ", " + cursorPt.y + ")");

                                    this.props.onChangeDBEntry({
                                        ...this.props.dbEntry,
                                        centerXRatio: cursorPt.x / imageWidth,
                                        centerYRatio: cursorPt.y / imageHeight,
                                    });
                                }}
                                style={{cursor: "pointer"}}
                            />

                        </g>
                    </g>
                </svg>
            );
        }

        // Other shapes

        return (
            <svg className="imageThumbnail shapeNone"
                 width={viewBoxSize} height={viewBoxSize}
                 viewBox={`-${viewBoxSize / 2} -${viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`}
                 xmlnsXlink="http://www.w3.org/1999/xlink"
            >
                <g transform={`rotate(${this.props.dbEntry.rotateDegrees})`}>
                    <g transform={`scale(${scaleBy}) translate(-${imageWidth / 2} -${imageHeight / 2})`}>
                        <image
                            href={this.props.src}
                            width={imageWidth}
                            height={imageHeight}
                        />
                    </g>
                </g>
            </svg>
        );
    }

}

export default ImageWithGeometry;
