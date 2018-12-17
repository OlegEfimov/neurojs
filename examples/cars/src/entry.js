var app = require('./index.js');
var car = require('./car.js');

// var socket = new WebSocket("ws://192.168.1.33:81/");

// function openSocket() {
// // text.html("Socket open");
// // socket.send("Hello server");
// }
// function showData(result) {
// // when the server returns, show the result in the div:
// // text.html("Sensor reading:" + result.data);

// var str = result.data;
// console.log(str);
// // str = str.substring(1,str.length-3)
// // console.log('str2= ' + str);
// var temp = new Array();
// // this will return an array with strings "1", "2", etc.
// temp = str.split(",");

// for (a in temp ) {
//     temp[a] = parseInt(temp[a], 10);
// }

// // window.sensorData = temp;
// window.gcd.world.agents[0].car.sensorData = temp;

// // var foundPos = result.data.indexOf('mm');
// // if (foundPos == -1) return;
// // var strPos = result.data.substring(1,foundPos);
// // var xPos = parseInt(strPos, 10);        // convert result to an integer
// // // text.position(xPos/2, 10);        // position the text
// // window.sensorData = xPos;
// // // console.log('------!!! = ' + strPos);
// }

function createLossChart() {
    var data = {
        series: [[], []]
    };

    return new Chartist.Line('#reward-chart', data, {
        lineSmooth: Chartist.Interpolation.none({
            fillHoles: true
        })
    });
}
function createLossChart2() {
    var data = {
        series: [[], []]
    };

    return new Chartist.Line('#action-chart', data, {
        lineSmooth: Chartist.Interpolation.none({
            fillHoles: true
        })
    });
}
function createLossChart3() {
    var data = {
        series: [[], []]
    };

    return new Chartist.Line('#koeff-chart', data, {
        lineSmooth: Chartist.Interpolation.none({
            fillHoles: true
        })
    });
}

function boot() {
    this.world = new app.world();
    this.renderer = new app.renderer(this.world, document.getElementById("container"));

    this.world.init(this.renderer)
    this.world.populate(1)

    this.dispatcher = new app.dispatcher(this.renderer, this.world);
    // this.dispatcher.doStart();

    this.world.chart = createLossChart();
    this.world.chart2 = createLossChart2();
    this.world.chart3 = createLossChart3();

    // socket.onopen = openSocket;
    // socket.onmessage = showData;

    return this.dispatcher;
};

function saveAs(dv, name) {
    var a;
    if (typeof window.downloadAnchor == 'undefined') {
        a = window.downloadAnchor = document.createElement("a");
        a.style = "display: none";
        document.body.appendChild(a);
    } else {
        a = window.downloadAnchor
    }

    var blob = new Blob([dv], { type: 'application/octet-binary' }),
        tmpURL = window.URL.createObjectURL(blob);

    a.href = tmpURL;
    a.download = name;
    a.click();

    window.URL.revokeObjectURL(tmpURL);
    a.href = "";
}

function downloadBrain(n) {
    let  dateNow = new Date().toJSON();
	var buf = window.gcd.world.agents[n].brain.export()
	saveAs(new DataView(buf), 'brain-' + dateNow + '.bin')
    document.getElementById('brain-file-name').innerText='brain-' + dateNow + '.bin';
}

function saveEnv() {
    let  dateNow = new Date().toJSON();
    saveAs(new DataView(window.gcd.world.export()), 'world-' + dateNow + '.bin')
    document.getElementById('world-file-name').innerText='world-' + dateNow + '.bin';
}

function readBrain(e) {
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function(){
        var buffer = reader.result
        var imported = window.neurojs.NetOnDisk.readMultiPart(buffer)

        for (var i = 0; i <  window.gcd.world.agents.length; i++) {
            window.gcd.world.agents[i].brain.algorithm.actor.set(imported.actor.clone())
            window.gcd.world.agents[i].brain.algorithm.critic.set(imported.critic)
            // window.gcd.world.agents[i].car.brain.learning = false
        }
    };

    reader.readAsArrayBuffer(input.files[0]);
    document.getElementById('brain-file-name').innerText=input.files[0].name;
}


function readWorld(e) {
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function(){
        var buffer = reader.result
        window.gcd.world.import(buffer)
    };

    reader.readAsArrayBuffer(input.files[0]);
    document.getElementById('world-file-name').innerText=input.files[0].name;
}

window.infopanel = {
    age: document.getElementById('agent-age')
}

function stats() {
    var agent = window.gcd.world.agents[0];
    window.infopanel.age.innerText = Math.floor(window.gcd.world.age) + '';
}

window.gcd = boot();
window.downloadBrain = downloadBrain;
window.saveEnv = saveEnv
window.readWorld = readWorld
window.updateIfLearning = function (value) {
    for (var i = 0; i <  window.gcd.world.agents.length; i++) {
        window.gcd.world.agents[i].brain.learning = value
        // window.gcd.world.agents[i].car.manualControlOn = !value
    }

    // window.gcd.world.plotRewardOnly = !value
};
window.setManualControl = function (value) {
    for (var i = 0; i <  window.gcd.world.agents.length; i++) {
        window.gcd.world.agents[i].car.manualControlOn = value
        if (value) {
            window.gcd.world.agents[i].car.handle(0, 0)
        }
    }

    // window.gcd.world.plotRewardOnly = !value
};

window.setHardware = function (value) {
    for (var i = 0; i <  window.gcd.world.agents.length; i++) {
        window.gcd.world.agents[i].car.hardwareOn = value
    }
};
window.getValueLow = function (id) {
    var element = document.getElementById(id);
    return element.valueLow;
};
window.getValueHigh = function (id) {
    var element = document.getElementById(id);
    return element.valueHigh;
};

window.readBrain = readBrain;

setInterval(stats, 100);