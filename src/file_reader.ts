import {ImageFile, ImageFileGroup, ImageFileGroupMap} from "./types";

declare const firebase: typeof import('firebase');

const fileReader = (user: firebase.User, withMainMetadata: boolean): Promise<ImageFileGroupMap> => {
     var imagesRef = firebase.storage().ref().child(`user/${user.uid}/images`);

    const bySha = new Map<string, ImageFileGroup>();

    const addDefault = (sha: string) => {
        console.debug(`Adding empty imageFileGroup for ${sha}`);
        const group: ImageFileGroup = {
            sha,
            thumbnails: new Map<string, ImageFile>(),
        };
        bySha.set(sha, group);
        return group;
    };

    const promisePage = (pageToken: string | null): Promise<any> => {
        console.log("promisePage", pageToken);

        return imagesRef.list({ pageToken }).then(listResult => {
            const ignoredNames: string[] = [];
            const promises: Promise<any>[] = [];

            console.log("promisePage", pageToken, "got", {
                nextPageToken: listResult.nextPageToken,
                itemCount: listResult.items.length,
            });

            listResult.items.map(ref => {
                const match = ref.name.match(/sha-256-(\w{64})(?:_(\d+x\d+))?$/);
                console.debug(`Got storage file ${ref.fullPath} sha=${match?.[1]} thumbnailSize=${match?.[2]}`);

                if (match) {
                    const sha = match[1];
                    const thumbnailSize = match[2];

                    const entry = bySha.get(sha) || addDefault(sha);

                    if (thumbnailSize) {
                        const thumbnail: ImageFile = {
                            path: ref.fullPath,
                        };
                        entry.thumbnails.set(thumbnailSize, thumbnail);
                    } else {
                        const main: ImageFile = {
                            path: ref.fullPath,
                        };
                        entry.main = main;

                        if (withMainMetadata) {
                            promises.push(
                                ref.getMetadata().then(metadata => main.metadata = metadata)
                            );
                        }
                    }
                } else {
                    ignoredNames.push(ref.name);
                }
            });

            if (ignoredNames.length > 0) {
                console.log("Ignored names:", { ignoredNames });
            }

            if (listResult.nextPageToken) {
                promises.push(promisePage(listResult.nextPageToken));
            }

            return Promise.all(promises);
        });
    };

    return promisePage(null).then(() => bySha);
};

export default fileReader;
