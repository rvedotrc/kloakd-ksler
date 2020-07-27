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

type State = {
    radiusRatio: number;
    isDraggingRadius: boolean;
    draggingRadiusR: number;

    centerXRatio: number;
    centerYRatio: number;
    isDraggingCenter: boolean;
    draggingCenterOffset: { x: number; y: number; };
};

class ImageWithGeometrySquare extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            radiusRatio: props.dbEntry.radiusRatio,
            isDraggingRadius: false,
            draggingRadiusR: 1,

            centerXRatio: props.dbEntry.centerXRatio,
            centerYRatio: props.dbEntry.centerYRatio,
            isDraggingCenter: false,
            draggingCenterOffset: { x: 0, y: 0 },
        };
    }

    private getSVGXY(event: React.MouseEvent): { x: number; y: number; } | undefined {
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

        return {
            x: cursorPt.x,
            y: cursorPt.y,
        };
    }

    updateDrag(event: React.MouseEvent) {
        if (this.state.isDraggingRadius) {
            const cursorPt = this.getSVGXY(event);
            if (!cursorPt) return;

            const {width: imageWidth, height: imageHeight} = this.props.widthAndHeight;
            const smallerImageDimension = (imageWidth < imageHeight) ? imageWidth : imageHeight;

            const distanceFromCenter = Math.sqrt(
                (cursorPt.x - imageWidth * this.props.dbEntry.centerXRatio) ** 2
                +
                (cursorPt.y - imageHeight * this.props.dbEntry.centerYRatio) ** 2
            );

            const radiusRatio = distanceFromCenter / smallerImageDimension;

            this.setState({
                radiusRatio: radiusRatio / this.state.draggingRadiusR,
            });
        } else if (this.state.isDraggingCenter) {
            const cursorPt = this.getSVGXY(event);
            if (!cursorPt) return;

            const {width: imageWidth, height: imageHeight} = this.props.widthAndHeight;

            const newXRatio = cursorPt.x / imageWidth;
            const newYRatio = cursorPt.y / imageHeight;

            this.setState({
                centerXRatio: newXRatio - this.state.draggingCenterOffset.x,
                centerYRatio: newYRatio - this.state.draggingCenterOffset.y,
            });
        }
    }

    cancelDrag() {
        this.setState({
            isDraggingRadius: false,
            radiusRatio: this.props.dbEntry.radiusRatio,

            isDraggingCenter: false,
            centerXRatio: this.props.dbEntry.centerXRatio,
            centerYRatio: this.props.dbEntry.centerYRatio,
        });
    }

    endDrag() {
        if (this.state.isDraggingRadius || this.state.isDraggingCenter) {
            this.props.onChangeDBEntry({
                ...this.props.dbEntry,
                radiusRatio: this.state.radiusRatio,
                centerXRatio: this.state.centerXRatio,
                centerYRatio: this.state.centerYRatio,
            });
        }

        this.cancelDrag();
    }

    render() {
        const { width: imageWidth, height: imageHeight } = this.props.widthAndHeight;
        const smallerImageDimension = (imageWidth < imageHeight) ? imageWidth : imageHeight;

        const desiredSize = this.props.desiredSize;
        const viewBoxSize = desiredSize * Math.sqrt(2.0);

        const scaleBy = desiredSize / smallerImageDimension;

        return (
            <svg className="imageThumbnail shapeNone"
                 width={viewBoxSize} height={viewBoxSize}
                 viewBox={`-${viewBoxSize / 2} -${viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`}
                 xmlnsXlink="http://www.w3.org/1999/xlink"
                 onMouseLeave={() => this.cancelDrag()}
                 onMouseUp={() => this.endDrag()}
                 onMouseMove={event => this.updateDrag(event)}
            >
                <g transform={`rotate(${this.props.dbEntry.rotateDegrees})`}>
                    <g transform={`scale(${scaleBy}) translate(-${imageWidth * this.props.dbEntry.centerXRatio} -${imageHeight * this.props.dbEntry.centerYRatio})`}>
                        <image
                            href={this.props.src}
                            width={imageWidth}
                            height={imageHeight}
                        />

                        <path
                            d={`
                                M ${imageWidth * this.state.centerXRatio - smallerImageDimension * this.state.radiusRatio}
                                  ${imageHeight * this.state.centerYRatio - smallerImageDimension * this.state.radiusRatio}
                                h ${smallerImageDimension * this.state.radiusRatio * 2}
                                v ${smallerImageDimension * this.state.radiusRatio * 2}
                                h -${smallerImageDimension * this.state.radiusRatio * 2}
                                z
                            `}
                            fill={"none"}
                            stroke={"red"}
                            />

                        <path
                            d={`
                                M ${imageWidth * this.state.centerXRatio - smallerImageDimension * this.state.radiusRatio}
                                  ${imageHeight * this.state.centerYRatio - smallerImageDimension * this.state.radiusRatio}
                                h ${smallerImageDimension * this.state.radiusRatio * 2}
                                v ${smallerImageDimension * this.state.radiusRatio * 2}
                                h -${smallerImageDimension * this.state.radiusRatio * 2}
                                z
                            `}
                            fill={"none"}
                            stroke={"transparent"}
                            strokeWidth={100}
                            style={{cursor: "pointer"}}
                            onMouseDown={event => {
                                this.setState({
                                    isDraggingRadius: true,
                                });

                                const cursorPt = this.getSVGXY(event);
                                if (!cursorPt) return;

                                const distanceFromCenter = Math.sqrt(
                                    (cursorPt.x - imageWidth * this.props.dbEntry.centerXRatio) ** 2
                                    +
                                    (cursorPt.y - imageHeight * this.props.dbEntry.centerYRatio) ** 2
                                );

                                const radiusRatio = distanceFromCenter / smallerImageDimension;

                                this.setState({
                                    draggingRadiusR: radiusRatio / this.props.dbEntry.radiusRatio,
                                });
                            }}
                        />

                        <path d={`
                            M ${imageWidth * this.state.centerXRatio} ${imageHeight * this.state.centerYRatio}
                            m -100 0 l 200 0
                            m -100 -100 l 0 200
                        `} stroke={"red"}/>
                        <circle
                            cx={imageWidth * this.state.centerXRatio}
                            cy={imageHeight * this.state.centerYRatio}
                            r={50}
                            fill={"transparent"}
                            stroke={"red"}
                            onMouseDown={event => {
                                const cursorPt = this.getSVGXY(event);
                                if (!cursorPt) return;

                                const newXRatio = cursorPt.x / imageWidth;
                                const newYRatio = cursorPt.y / imageHeight;

                                this.setState({
                                    isDraggingCenter: true,
                                    draggingCenterOffset: {
                                        x: newXRatio - this.props.dbEntry.centerXRatio,
                                        y: newYRatio - this.props.dbEntry.centerYRatio,
                                    },
                                });
                            }}
                            style={{cursor: "pointer"}}
                        />

                    </g>
                </g>
            </svg>
        );
    }

}

export default ImageWithGeometrySquare;
