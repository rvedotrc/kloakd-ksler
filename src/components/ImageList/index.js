import React, { Component } from 'react';

import Dropzone from 'react-dropzone'
import PropTypes from "prop-types";

class ImageList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            // uploadTasks: [],
        };
    }

    componentDidMount() {
        var imagesRef = firebase.storage().ref().child(`user/${this.props.user.uid}/images`);

        imagesRef.list().then(listResult => {
            const promises = listResult.items.map(childRef => {
                return childRef.getMetadata()
                    .then(metadata => ({
                        fullPath: childRef.fullPath,
                        metadata,
                    }));
            });

            return Promise.all(promises);
        }).then(imageList => {
            console.log("imageList", imageList);
            this.setState({ imageList });
        }).catch(e => console.log('storage list failed', e));
    }

    findExistingImage(path) {
        if (!this.state) return;

        const { imageList } = this.state;
        if (!imageList) return;

        return imageList.find(image => image.fullPath == path);
    }

    startUpload(file, path) {
        const uploadTask = firebase.storage().ref().child(path)
            .put(file, { contentType: file.type });

        // this.setState((state, props) => {
        //     const task = {uploadTask, path};
        //     return {
        //         uploadTasks: state.uploadTasks.concat([task]),
        //     };
        // });

        // pause, resume, cancel

        uploadTask.on(
            firebase.storage.TaskEvent.STATE_CHANGED,
            snapshot => {
                var percent = snapshot.bytesTransferred / snapshot.totalBytes * 100;
                console.log("file", path, `upload progress is ${percent}%`);
            },
            error => {
                console.log("file", path, "upload failed:", error);
            },
            () => {
                console.log("file", path, "upload complete. woot!");
            },
        );

        return uploadTask;
    }

    uploadFiles(files) {
        console.log("files =", files);

        files.map(file => {
            file.arrayBuffer().then(buffer => {
                return crypto.subtle.digest('SHA-256', buffer);
            }).then(digestBuffer => {
                const digestArray = Array.from(new Uint8Array(digestBuffer));
                const digestString = digestArray.map(b => b.toString(16).padStart(2, '0')).join('');
                console.log("file", file.name, "has digest", digestString);

                const path = `user/${this.props.user.uid}/images/sha-256-${digestString}`;

                const existingImage = this.findExistingImage(path);
                if (existingImage) {
                    console.log(`Declining to upload ${file.path} because it already exists at ${path}`, existingImage);
                    return;
                }

                return this.startUpload(file, path);
            }).catch(error => {
                console.log("error while processing file", file.name, ":", error);
            });
        });
    }

    render() {
        const { imageList } = this.state;

        return (
            <div>
                <h1>Image List / Upload</h1>

                <p>Let&apos; collect pictures of manhole covers! Some of them are so pretty!</p>

                <h2>Feed me!</h2>

                <Dropzone onDrop={this.uploadFiles.bind(this)}>
                    {({getRootProps, getInputProps}) => (
                        <section>
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <p>Drop your pictures here, or click to choose some files. Nom nom nom.</p>
                            </div>
                        </section>
                    )}
                </Dropzone>

                {imageList && (
                    <div>
                        <h2>List</h2>
                        <ol>
                            {imageList.map(image => {
                                console.log("rendering ref", image);
                                const parts = image.fullPath.split('/');
                                const basename = parts[parts.length - 1];

                                return (<li key={image.fullPath}>
                                    {basename}
                                    {' '}
                                    ({image.metadata.size})
                                    {/*({JSON.stringify(image.metadata)})*/}
                                </li>);
                            })}
                        </ol>
                    </div>
                )}
            </div>
        )
    }

}

ImageList.propTypes = {
    user: PropTypes.object.isRequired
};

export default ImageList;
