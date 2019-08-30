(function () {
    'use strict';

    const fs = require('fs');
    const { desktopCapturer } = require('electron');
    let recorder, blobs = [];

    angular
        .module('app')
        .service('recorderService', Service);

    Service.$inject = ['$http', '$rootScope'];

    function Service($http, $rootScope) {
        this.recorder = {
            startRecord () {
                desktopCapturer.getSources({types: ['window', 'screen']})
                    .then(async() => {
                        const stream = await navigator.webkitGetUserMedia({
                            audio: false,
                            video: {
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    minWidth: 1280,
                                    maxWidth: 1280,
                                    minHeight: 720,
                                    maxHeight: 720
                                }
                            },
                            frameRate: {
                                min: 50,
                                ideal: 200,
                                max: 600
                            }
                        }, this.handleStream, err => {
                            console.log('error', err);
                        });
                    })
                    .catch(error => console.log(error))
            },
            handleStream(stream) {
                recorder = new MediaRecorder(stream);
                blobs = [];
                recorder.ondataavailable = function (event) {
                    blobs.push(event.data);
                };
                recorder.start();
            },
            toArrayBuffer(blob, cb) {
                const fileReader = new FileReader();
                fileReader.onload = function() {
                    const arrayBuffer = this.result;
                    cb(arrayBuffer);
                };
                fileReader.readAsArrayBuffer(blob);
            },
            toBuffer(ab) {
                const buffer = new Buffer(ab.byteLength);
                const arr = new Uint8Array(ab);
                for (let i = 0; i < arr.byteLength; i++) {
                    buffer[i] = arr[i];
                }
                return buffer;
            },
            stopRecord(userPath, saveOnline) {
                recorder.onstop = () => {
                    return new Promise(resolve => {
                        this.toArrayBuffer(new Blob(blobs, {type: 'video/webm'}), (chunk) => {
                            const buffer = this.toBuffer(chunk);
                            const path = userPath + '/shot.webm';
                            fs.writeFile(path, buffer, function (err) {
                                if (!err) {
                                    console.log('Saved video: ' + path, 'do save online?', saveOnline);
                                    if(saveOnline) {
                                        console.log('save online');
                                        const buff = Buffer.from(buffer).toString('base64');
                                        $http({
                                            method: 'POST',
                                            url: 'https://api.cloudinary.com/v1_1/dyqhomagf/upload',
                                            data: {
                                                upload_preset: 'bsfgxm61',
                                                file: 'data:video/webm;base64,' + buff
                                            },
                                            uploadEventHandlers: {
                                                progress: function (e) {
                                                    console.log(e);
                                                    if(e && e.total && e.loaded) {
                                                        const progress = Math.floor(e.total / e.loaded);
                                                        $rootScope.progress = progress;
                                                    }
                                                    
                                                }
                                            }
                                        })
                                        .then(function (res) {
                                            console.log('Saved online', res.data.secure_url);
                                            resolve(res.data.secure_url);
                                        })
                                        .catch(function (err) {
                                            console.log('Error saving online', err);
                                        });
    
                                    }
                                } else {
                                    alert('Failed to save video ' + err);
                                }
                            });
                        });
                    });
                };
                recorder.stop();
            }
        }
    }

})();