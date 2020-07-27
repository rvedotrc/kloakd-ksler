import * as React from 'react';
import {DBEntry} from "../../types";
import {WidthAndHeight} from "./image_loader";
import ImageWithGeometryCircle from "./image_with_geometry_circle";

type Props = {
    src: string;
    widthAndHeight: WidthAndHeight;
    dbEntry: DBEntry;
    onChangeDBEntry: (dbEntry: DBEntry) => void;
    desiredSize: number;
};

type State = {};

class ImageWithGeometry extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
    }

    private getShape(): string | undefined {
        return this.props.dbEntry.tags.find(tag => tag.startsWith("shape:"))?.replace("shape:", "");
    }

    render() {
        const shape = this.getShape();

        if (shape === 'circle') {
            return (
                <ImageWithGeometryCircle
                    src={this.props.src}
                    widthAndHeight={this.props.widthAndHeight}
                    dbEntry={this.props.dbEntry}
                    onChangeDBEntry={this.props.onChangeDBEntry}
                    desiredSize={this.props.desiredSize}
                />
            );
        }


        const { width: imageWidth, height: imageHeight } = this.props.widthAndHeight;
        const smallerImageDimension = (imageWidth < imageHeight) ? imageWidth : imageHeight;

        const desiredSize = this.props.desiredSize;
        const viewBoxSize = desiredSize * Math.sqrt(2.0);

        const scaleBy = desiredSize / smallerImageDimension;

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
