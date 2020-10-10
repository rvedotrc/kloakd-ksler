import {ImageFileMap} from "./types";

declare const firebase: typeof import('firebase');

const fileReader = (user: firebase.User): Promise<ImageFileMap> => {
     const imagesRef = firebase.storage().ref().child(`user/${user.uid}/images`);

    const byFullPath: ImageFileMap = new Map();

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
                // console.debug(`Got storage file ${ref.fullPath} sha=${match?.[1]} thumbnailSize=${match?.[2]}`);

                if (match) {
                    const sha = match[1];
                    const thumbnailSize = match[2];

                    if (!thumbnailSize) {
                        promises.push(
                            ref.getMetadata().then(metadata =>
                                byFullPath.set(ref.fullPath, {
                                    _tag: "main",
                                    path: ref.fullPath,
                                    sha,
                                    metadata,
                                })
                            )
                        );
                    } else {
                        byFullPath.set(ref.fullPath, {
                            _tag: "thumbnail",
                            path: ref.fullPath,
                            sha,
                            thumbnailSize,
                        });
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

    return promisePage(null).then(() => {
        console.log(`Read ${byFullPath.size} files`);
        return byFullPath;
    });
};

export default fileReader;
