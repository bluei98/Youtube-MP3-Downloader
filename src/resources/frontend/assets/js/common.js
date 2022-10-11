const path = require('path');

window.$ = window.jQuery = require('jquery');
const { ipcRenderer, dialog } = require('electron');

const moment = require('moment');
const axios = require('axios');
const cheerio = require('cheerio');


function selectFolder() {
    var ret = ipcRenderer.sendSync('selectFolder');
    return ret;
}

function selectFile() {
    var ret = ipcRenderer.sendSync('selectFile');
    return ret;
}

function notification(title, body) {
    const myNotification = new Notification(title, {
        body: body
    });
    
    myNotification.onclick = () => {
        console.log('Notification clicked')
    };
}

const onlineStatus = () => { return navigator.onLine; }