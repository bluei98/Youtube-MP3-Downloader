const iconvLite = require('iconv-lite');
const cp = require('child_process');
const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
var CryptoJS = require("crypto-js");

ffmpeg.setFfmpegPath(ffmpegPath);

$(function () {
    let config = JSON.parse(fs.readFileSync('config.json'));
    $('input[name=targetDir]').val(config.targetDir);

    const webview = document.getElementById('content');
    
    function loadStart() {
        $('input[name=uri]').val(webview.getURL());
    }
    webview.addEventListener('did-start-loading', loadStart);
});

function selectDownloadFolder() {
    let folder = selectFolder();
    $('input[name=targetDir]').val(folder);
    fs.writeFileSync('config.json', JSON.stringify({targetDir: folder}));
}

function youtube_parser(url){
    let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    let match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}

async function download() {
    let targetDir = $('input[name=targetDir]').val();
    let uri = $('input[name=uri]').val();

    if(uri.trim() == '') {
        alert('Please enter a valid YouTube URL.');
    }

    let id = youtube_parser(uri);

    ytdl.getInfo(uri).then(info => {
        let title = info.videoDetails.title;
        let maxBitrate = 0;
        let audioFormat = 0;
        let contentLength = 0;

        let $data = `<tr data-id="${info.videoDetails.videoId}">
            <td class="title text-light">${title}</td>
            <td class="progressStatus text-light">0%</td>
        </tr>`;
        $('table tbody').prepend($data);

        const tracker = {
            start: Date.now(),
            audio: { downloaded: 0, total: Infinity },
            merged: { frame: 0, speed: '0x', fps: 0 },
        };
    
        const stream = ytdl(uri, { quality: 'highestaudio' }).on('progress', (_, downloaded, total) => {
            tracker.audio = { downloaded, total };
        });

        let progressbarHandle = null;
        const progressbarInterval = 100;
    
        const showProgress = () => {
            const toMB = i => (i / 1024 / 1024).toFixed(2);
            const downloadProgress = (tracker.audio.downloaded/tracker.audio.total*100).toFixed(2);
            $('tr[data-id="'+info.videoDetails.videoId+'"] .progressStatus').text(`${downloadProgress}%`);
        }

        let start = Date.now();
        ffmpeg(stream)
            .audioBitrate(160)
            .save(`${targetDir}/${id}.mp3`)
            .on('progress', p => {
                if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
            })
            .on('end', () => {
                fs.rename(`${targetDir}/${id}.mp3`, `${targetDir}/${title.replace(/\//g, '-')}.mp3`, function(err) {
                    
                });
                clearInterval(progressbarHandle);
                console.log(progressbarHandle);
                progressbarHandle = null;
            });
    });
}
