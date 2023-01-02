const iconvLite = require('iconv-lite');
const cp = require('child_process');
const fs = require('fs');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
var CryptoJS = require("crypto-js");

var YoutubeMp3Downloader = require("youtube-mp3-downloader");

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
    let uri = $('input[name=uri]').val();

    if(uri.trim() == '') {
        alert('Please enter a valid YouTube URL.');
    }

    let id = youtube_parser(uri);
    if(id) {
        var playlistId = getYoutubePlaylistId(uri);
        let items = await getPlayList(playlistId);
        if(items.length > 0) {
            items.forEach(item => {
                startDownload(item);
            });
        }
        else {
            startDownload(uri);
        }
    }
    else {
        alert('Please enter a valid YouTube URL.');
    }
}

function retryError() {
    $('tr[data-id]').each(function(i, item) {
        if($('td:last-child', $(item)).text() == "ERROR") {
            let uri = $(item).attr("data-id");
            $(item).remove();
            startDownload(uri);
        }
    });
}

function startDownload(uri) {
    let targetDir = $('input[name=targetDir]').val();
    let id = youtube_parser(uri);

    ytdl.getInfo(uri).then(info => {
        var YD = new YoutubeMp3Downloader({
            "ffmpegPath": ffmpegPath,                   // FFmpeg binary location
            "outputPath": `${targetDir}`,               // Output file location (default: the home directory)
            "youtubeVideoQuality": "highestaudio",      // Desired video quality (default: highestaudio)
            "queueParallelism": 10,                     // Download parallelism (default: 1)
            "progressTimeout": 2000,                    // Interval in ms for the progress reports (default: 1000)
            "allowWebm": false,                         // Enable download from WebM sources (default: false)
            // "outputOptions": ["-af", "volume=0.5"]      // Additional output options
        });

        let title = info.videoDetails.title;
        let $data = `<tr data-id="${info.videoDetails.videoId}" data-url="${uri}" data-error="">
            <td class="title text-light text-truncate" style="max-width: 194px;">${title}</td>
            <td class="progressSpeed text-end text-light"></td>
            <td class="progressSize text-end text-light"></td>
            <td class="progressStatus text-end text-light">0%</td>
        </tr>`;
        $('table tbody').prepend($data);

        YD.download(id);

        YD.on("finished", function(err, data) {
            $('tr[data-id="'+info.videoDetails.videoId+'"] .progressStatus').text('Done');
        });
        
        YD.on("error", function(error) {
            $('tr[data-id="'+info.videoDetails.videoId+'"] .progressStatus').text('ERROR');
            $('tr[data-id="'+info.videoDetails.videoId+'"]').attr("data-error", "ERROR");
            console.log(error);
        });
        
        YD.on("progress", function(progress) {
            $('tr[data-id="'+info.videoDetails.videoId+'"] .progressSpeed').text(`${getFileSize(progress.progress.speed)}/s`);
            $('tr[data-id="'+info.videoDetails.videoId+'"] .progressSize').text(`${getFileSize(progress.progress.transferred)}`);
            $('tr[data-id="'+info.videoDetails.videoId+'"] .progressStatus').text(`${progress.progress.percentage.toFixed(2)}%`);
        });
    });
}

function getFileSize(size) {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (size / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
}

function getYoutubePlaylistId(url) {
    var id = /[&|\?]list=([a-zA-Z0-9_-]+)/gi.exec(url)
    return (id && id.length > 0) ? id[1] : false
}

async function getPlayList(playlistId, ret=[], continuation=null) {
    let playlist = await ytpl(playlistId, { pages: 1});
    playlist.items.forEach(item => {
        ret.push(item.shortUrl);
    });
    
    try {
        while(playlist = await ytpl.continueReq(playlist.continuation)) {
            playlist.items.forEach(item => {
                ret.push(item.shortUrl);
            });
        }
    }
    catch(e) {

    }
    return ret;
}