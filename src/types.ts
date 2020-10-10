export type MainImageFile = {
    _tag: "main";
    path: string;
    sha: string;
    metadata: {
        fullPath: string;
        size: number;
        customMetadata: any;
    };
}

export type ThumbnailImageFile = {
    _tag: "thumbnail";
    path: string;
    sha: string;
    thumbnailSize: string;
}

export type ImageFile = MainImageFile | ThumbnailImageFile;

export type ImageFileMap = Map<string, ImageFile>;

export type ImageFileGroup = {
    sha: string;
    main?: MainImageFile;
    thumbnails: Map<string, ThumbnailImageFile>;
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
