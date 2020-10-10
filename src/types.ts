export type ImageFile = {
    path: string;
    metadata?: {
        fullPath: string;
        size: number;
        customMetadata: any;
    };
};

export type ImageFileGroup = {
    sha: string;
    main?: ImageFile;
    thumbnails: Map<string, ImageFile>;
};

export type ImageFileGroupMap = Map<string, ImageFileGroup>;

export type DBEntry = {
    text: string;
    tags: string[];
    rotateDegrees: number;
    centerXRatio: number;
    centerYRatio: number;
    radiusRatio: number;
};

export type ExifDBEntry = {
    tags: string[];
    rawData: any;
}
