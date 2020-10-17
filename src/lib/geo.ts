import {currentExifDbEntries} from "lib/app_context";

export const forSha = (sha: string) => {
    const exif = currentExifDbEntries.getValue()?.get(sha);
    let url: string | null = null;

    if (exif?.rawData?.tags) {
        const {GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef} = exif.rawData.tags;

        if (GPSLatitude && GPSLatitudeRef && GPSLongitude && GPSLongitudeRef) {
            url = `https://geohack.toolforge.org/geohack.php?params=`
                + `${GPSLatitude}_${GPSLatitudeRef}_${GPSLongitude}_${GPSLongitudeRef}`;
        }
    }

    if (!url) return null;

    return {
        geohackUrl: url,
    };
};
