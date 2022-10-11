const iconvLite = require('iconv-lite');
const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

$(function () {
    let config = JSON.parse(fs.readFileSync('config.json'));
    $('input[name=targetDir]').val(config.targetDir);
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
        $('#progressBar').css("width", "0%");

        let title = info.videoDetails.title;
        let maxBitrate = 0;
        let audioFormat = 0;
        let contentLength = 0;
        console.log(info.formats);
        info.formats.forEach(function(format, i)  {
            if(format.audioBitrate != null) {
                if(format.audioBitrate > maxBitrate) {
                    maxBitrate = format.audioBitrate;
                    audioFormat = i;
                    contentLength = format.contentLength;
                }
            }
        });
        console.log(info.formats[audioFormat]);
        let stream = ytdl(uri, {
            quality: 'highestaudio',
        });

        let start = Date.now();
        ffmpeg(stream)
            .audioBitrate(160)
            .save(`${targetDir}/${id}.mp3`)
            .on('progress', p => {
                console.log(p);
            })
            .on('end', () => {
                fs.rename(`${targetDir}/${id}.mp3`, `${targetDir}/${title.replace(/\//g, '-')}.mp3`, function(err) {
                    
                });
                $('#progressBar').css("width", "100%");
            });
    });


}