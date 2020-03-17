import React, { Component } from 'react';

import Dropzone from 'react-dropzone'
import PropTypes from "prop-types";
import Workspace from "../Workspace";

class Welcome extends Component {

    constructor(props) {
        super(props);
        this.state = {};
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

                return firebase.storage().ref().child(path)
                    .put(file, { contentType: file.type })
                    .then(uploadTask => uploadTask.then)
                    .then(uploadSnapshot => {
                        console.log("file", file, "upload to", path, "ended with", uploadSnapshot);
                    });
            }).catch(error => {
                console.log("error while processing file", file.name, ":", error);
            });
        });
    }

    render() {
        const { imageList } = this.state;

        return (
            <div>
                <h1>Kloakdæksler</h1>

                <p>Let&apos; collect pictures of manhole covers! Some of them are so pretty!</p>

                <h2>Feed me!</h2>

                <Dropzone onDrop={this.uploadFiles.bind(this)}>
                    {({getRootProps, getInputProps}) => (
                        <section>
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <p>Drop your pictures here. Nom nom nom.</p>
                            </div>
                        </section>
                    )}
                </Dropzone>

                {imageList && (
                    <ol>
                        {imageList.map(image => {
                            console.log("rendering ref", image);
                            return (<li key={image.fullPath}>
                                {image.fullPath} ({JSON.stringify(image.metadata)})
                            </li>);
                        })}
                    </ol>
                )}
            </div>
        )
    }

}

Workspace.propTypes = {
    user: PropTypes.object.isRequired
};

export default Welcome;
