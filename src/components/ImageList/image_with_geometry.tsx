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

    rotateDegrees: number;
    isRotating: boolean;
    rotationOffset: number;
};

class ImageWithGeometry extends React.Component<Props, State> {

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

            rotateDegrees: props.dbEntry.rotateDegrees,
            isRotating: false,
            rotationOffset: 0,
        };
    }

    private getShape(): string | undefined {
        return this.props.dbEntry.tags.find(tag => tag.startsWith("shape:"))?.replace("shape:", "");
    }

    private getSVGXY(event: React.MouseEvent): { x: number; y: number; } | undefined {
        const svg = (event.target as SVGGraphicsElement);
        if (!svg) return;
        if (!svg.ownerSVGElement) return;

        const referenceElement = document.getElementById("svgImage") as any as SVGSVGElement;
        const screenCTM = referenceElement.getScreenCTM();
        if (!screenCTM) return;

        const pt = svg.ownerSVGElement.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;

        // The cursor point, translated into svg coordinates
        const cursorPt = pt.matrixTransform(screenCTM.inverse());

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
        } else if (this.state.isRotating) {
            const cursorPt = this.getSVGXY(event);
            if (!cursorPt) return;

            const { width: imageWidth, height: imageHeight } = this.props.widthAndHeight;

            const angleOfCursor = Math.atan2(
                cursorPt.y - imageHeight * this.state.centerYRatio,
                cursorPt.x - imageWidth * this.state.centerXRatio,
            ) * 180 / Math.PI;

            const adjustment = angleOfCursor - this.state.rotationOffset;

            this.setState({
                rotateDegrees: (360 + this.state.rotateDegrees + adjustment) % 360,
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

            isRotating: false,
            rotateDegrees: this.props.dbEntry.rotateDegrees,
        });
    }

    endDrag() {
        if (this.state.isDraggingRadius || this.state.isDraggingCenter || this.state.isRotating) {
            this.props.onChangeDBEntry({
                ...this.props.dbEntry,
                radiusRatio: this.state.radiusRatio,
                centerXRatio: this.state.centerXRatio,
                centerYRatio: this.state.centerYRatio,
                rotateDegrees: this.state.rotateDegrees,
            });
        }

        this.cancelDrag();
    }

    renderGrid(viewBoxSize: number): React.ReactNode {
        const n = 40;
        let d = "";

        for (let i=-0.5; i<=1; i+=1.0/n) {
            d = d + ` M ${viewBoxSize * i} ${viewBoxSize * -0.5} v ${viewBoxSize}`;
            d = d + ` M ${viewBoxSize * -0.5} ${viewBoxSize * i} h ${viewBoxSize}`;
        }

        return <path d={d} stroke={"white"} opacity={0.5}/>;
    }

    renderConcentricCircles(cx: number, cy: number, r: number): React.ReactNode {
        const n = 10;
        let children: React.ReactNodeArray = [];

        for (let i=1; i<=n; ++i) {
            const thisR = r * i / n;
            children.push(<circle key={i} cx={cx} cy={cy} r={thisR}/>);
        }

        return <g fill={"none"} stroke={"white"} opacity={0.5}>{children}</g>;
    }

    render() {
        const { width: imageWidth, height: imageHeight } = this.props.widthAndHeight;
        const smallerImageDimension = (imageWidth < imageHeight) ? imageWidth : imageHeight;

        const desiredSize = this.props.desiredSize;
        const viewBoxSize = desiredSize * Math.sqrt(2.0);

        const scaleBy = desiredSize / smallerImageDimension;

        const shape = this.getShape();
        const isCircle = (shape === 'circle');
        const isSquare = (shape === 'square' || shape === 'circleinsquare');
        const hasBox = (isCircle || isSquare);

        return (
            <svg className="imageThumbnail shapeNone"
                 width={viewBoxSize} height={viewBoxSize}
                 viewBox={`-${viewBoxSize / 2} -${viewBoxSize / 2} ${viewBoxSize} ${viewBoxSize}`}
                 xmlnsXlink="http://www.w3.org/1999/xlink"
                 onMouseLeave={() => this.cancelDrag()}
                 onMouseUp={() => this.endDrag()}
                 onMouseMove={event => this.updateDrag(event)}
            >
                <g transform={`rotate(${this.state.rotateDegrees})`}>
                    <g transform={`scale(${scaleBy}) translate(-${imageWidth * this.props.dbEntry.centerXRatio} -${imageHeight * this.props.dbEntry.centerYRatio})`}>
                        <image
                            id={"svgImage"}
                            href={this.props.src}
                            width={imageWidth}
                            height={imageHeight}
                        />

                        <defs>
                            {isCircle && (
                                <circle id="boxPath"
                                        cx={imageWidth * this.state.centerXRatio}
                                        cy={imageHeight * this.state.centerYRatio}
                                        r={smallerImageDimension * this.state.radiusRatio}
                                />
                            )}
                            {isSquare && (
                                <path id="boxPath"
                                    d={`
                                        M ${imageWidth * this.state.centerXRatio - smallerImageDimension * this.state.radiusRatio}
                                          ${imageHeight * this.state.centerYRatio - smallerImageDimension * this.state.radiusRatio}
                                        h ${smallerImageDimension * this.state.radiusRatio * 2}
                                        v ${smallerImageDimension * this.state.radiusRatio * 2}
                                        h -${smallerImageDimension * this.state.radiusRatio * 2}
                                        z
                                    `}
                                />
                            )}
                        </defs>

                        {hasBox && (
                            <>
                                {/* Visible rendering of the box */}
                                <use xlinkHref="#boxPath"
                                    fill={"none"}
                                    stroke={"red"}
                                />

                                {/* Invisible grabbable area of the box */}
                                <use xlinkHref="#boxPath"
                                    fill={"none"}
                                    stroke={"transparent"}
                                    strokeWidth={100}
                                    style={{cursor: "nwse-resize"}}
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
                            </>
                        )}

                        {this.state.isDraggingCenter && this.renderConcentricCircles(
                            imageWidth * this.state.centerXRatio,
                            imageHeight * this.state.centerYRatio,
                            smallerImageDimension / 2,
                        )}

                    </g>
                </g>

                {/* The centre circle / crosshairs / rotation handles */}
                {!this.state.isRotating && !this.state.isDraggingCenter && !this.state.isDraggingRadius && (
                    <>
                        {/* Centre crosshairs */}
                        <path d={`
                                    M 0 0
                                    m -100 0 l 200 0
                                    m -100 -100 l 0 200
                                `} stroke={"red"}/>

                        {/* The centre "move" circle */}
                        <circle
                            cx="0"
                            cy="0"
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
                            style={{cursor: "move"}}
                        />

                        {/* Rotation handles on the ends of the crosshairs */}
                        <g
                            onMouseDown={event => {
                                this.setState({
                                    isRotating: true,
                                });

                                const cursorPt = this.getSVGXY(event);
                                if (!cursorPt) return;

                                const angleOfCursor = Math.atan2(
                                    cursorPt.y - imageHeight * this.state.centerYRatio,
                                    cursorPt.x - imageWidth * this.state.centerXRatio,
                                ) * 180 / Math.PI;

                                this.setState({
                                    rotationOffset: angleOfCursor,
                                });
                            }}
                            style={{cursor: "ew-resize"}}
                        >
                            <circle cx="-100" cy="0" r="10" fill="transparent" stroke="red"/>
                            <circle cx="+100" cy="0" r="10" fill="transparent" stroke="red"/>
                            <circle cx="0" cy="-100" r="10" fill="transparent" stroke="red"/>
                            <circle cx="0" cy="+100" r="10" fill="transparent" stroke="red"/>
                        </g>
                    </>
                )}

                {this.state.isRotating && this.renderGrid(viewBoxSize)}
            </svg>
        );
    }

}

export default ImageWithGeometry;
