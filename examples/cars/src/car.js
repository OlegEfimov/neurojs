var color = require('./color.js'),
    sensors = require('./sensors.js'),
    tc = require('./tiny-color.js');

// var MAX_DISTANCE = 100; // in cm

class Car {

    constructor(world, opt) {
        this.maxSteer = Math.PI / 7
        this.maxEngineForce = 170
        this.maxBrakeForce = 5
        this.maxBackwardForce = 2
        this.linearDamping = 1

        this.contact = []
        this.contactKoeff = []
        this.impact = 0

        this.world = world
        this.manualControlOn = true
        this.hardwareOn = false
        this.sensorData = [];
        this.action = [];

        // this.socket = new WebSocket("ws://192.168.1.37:81/");
       this.socket = new ReconnectingWebSocket("ws://192.168.0.37:81/");
        // this.socket = {};
        // this.socket.debug = true;

        this.init()
    }

    openSocket() {
        // text.html("Socket open");
        // socket.send("Hello server");
      console.log('socket onopen'); 
    }
    closeSocket() {
      console.log('socket closed'); 
    }

    showData(result) {
        // when the server returns, show the result in the div:
        // text.html("Sensor reading:" + result.data);

        var str = result.data;
        // console.log(str);
        // str = str.substring(1,str.length-3)
        // console.log('str2= ' + str);
        var temp = new Array();
        // this will return an array with strings "1", "2", etc.
        temp = str.split(",");

        for (let a in temp ) {
            temp[a] = parseInt(temp[a], 10);
        }

        // for (let a in temp ) {
        //     temp[a] = temp[a] === 0 ? MAX_DISTANCE : temp[a];
        // }


        // window.sensorData = temp;
        window.gcd.world.agents[0].car.sensorData = temp;

        // var foundPos = result.data.indexOf('mm');
        // if (foundPos == -1) return;
        // var strPos = result.data.substring(1,foundPos);
        // var xPos = parseInt(strPos, 10);        // convert result to an integer
        // // text.position(xPos/2, 10);        // position the text
        // window.sensorData = xPos;
        // // console.log('------!!! = ' + strPos);
    }

    init() {
        this.createPhysicalBody()

        this.sensors = Car.Sensors.build(this)
        this.speed = this.sensors.getByType("speed")[0]
        // Math.random()
        // for (let i = 0; i < 16; i++) {
        //     this.sensorData[i] =  Math.random() * 100
        // }
        // this.sensorData[16] =  Math.random() * 100

        this.socket.onopen = this.openSocket;
        this.socket.onclose = this.closeSocket;
        this.socket.onmessage = this.showData;

    }

    createPhysicalBody() {
        // Create a dynamic body for the chassis
        this.chassisBody = new p2.Body({
            mass: 5,
            damping: 1,
            angularDamping: 1,
            ccdSpeedThreshold: 0,
            ccdIterations: 40
        });

        this.wheels = {}
        this.chassisBody.color = color.randomPastelHex();
        this.chassisBody.car = true;
        this.chassisBody.damping = this.linearDamping;

        var boxShape = new p2.Box({ width: 0.5, height: 1 });
        boxShape.entity = Car.ShapeEntity

        this.chassisBody.addShape(boxShape);

        var w = 0.1, h = 0.25
        var space = 0.15
        var frontRightPosBox = {
            x: -0.25,
            y: 0.5 - space
        }
        var frontLeftPosBox = {
            x: 0.25,
            y: 0.5 - space
        }
        var backRightPosBox = {
            x: -0.25,
            y: -0.5 + space
        }
        var backLeftPosBox = {
            x: 0.25,
            y: -0.5 + space
        }

        var frontRightPos = {
            x: -0.25 - w / 2,
            y: 0.5 - h - space
        }
        var frontLeftPos = {
            x: 0.25 - w / 2,
            y: 0.5 - h - space
        }
        var backRightPos = {
            x: -0.25 - w / 2,
            y: -0.5 + space
        }
        var backLeftPos = {
            x: 0.25 - w / 2,
            y: -0.5 + space
        }

        this.chassisBody.gl_create = (function (sprite, r) {
            this.overlay = new PIXI.Graphics();
            this.overlay.visible = true;

            sprite.addChild(this.overlay);

            var wheels = new PIXI.Graphics()
            sprite.addChild(wheels)

            // var w = 0.1, h = 0.25
            // var space = 0.15
            var col = "#" + this.chassisBody.color.toString(16)
                col = parseInt(tc(col).darken(50).toHex(), 16)
            var alpha = 0.35, alphal = 0.9

            // var tl = new PIXI.Graphics()
            // var tr = new PIXI.Graphics()

            // var col1 = "#ff0000"
            //     col1 = parseInt(tc(col1).darken(50).toHex(), 16)

            // tl.beginFill(col1, 0.25)
            // tl.position.x = -0.25
            // tl.position.y = 0.5 - h / 2 - space
            // tl.drawRect(-w / 2, -h / 2, w, h)
            // tl.endFill()

            // var col2 = "#00ff00"
            //     col2 = parseInt(tc(col2).darken(50).toHex(), 16)
            // tr.beginFill(col2, 0.5)
            // tr.position.x = 0.25
            // tr.position.y = 0.5 - h / 2 - space
            // tr.drawRect(-w / 2, -h / 2, w, h)
            // tr.endFill()

            // // this.wheels.topLeft = tl
            // // this.wheels.topRight = tr

            // wheels.addChild(tl)
            // wheels.addChild(tr)


            var col1 = "#ff0000"
                col1 = parseInt(tc(col1).darken(50).toHex(), 16)
            wheels.beginFill(col1, 0.25)
            // wheels.lineStyle(0.01, col, alphal)
            wheels.drawRect( frontRightPos.x, frontRightPos.y, w, h)
            wheels.endFill()

            var col2 = "#00ff00"
                col2 = parseInt(tc(col2).darken(50).toHex(), 16)
            wheels.beginFill(col2, 0.5)
            // wheels.lineStyle(0.01, col, alphal)
            wheels.drawRect(frontLeftPos.x, frontLeftPos.y, w, h)
            wheels.endFill()

            var col3 = "#0000ff"
                col3 = parseInt(tc(col3).darken(50).toHex(), 16)
            wheels.beginFill(col3, 0.75)
            // wheels.lineStyle(0.01, col, alphal)
            wheels.drawRect(backRightPos.x, backRightPos.y, w, h)
            wheels.endFill()

            var col4 = "#000000"
                col4 = parseInt(tc(col4).darken(50).toHex(), 16)
            wheels.beginFill(col4, 1)
            // wheels.lineStyle(0.01, col, alphal)
            wheels.drawRect(backLeftPos.x, backLeftPos.y, w, h)
            wheels.endFill()
        }).bind(this); 

        // Create the vehicle
        this.vehicle = new p2.TopDownVehicle(this.chassisBody);

        // // Add one front wheel and one back wheel - we don't actually need four :)
        // this.frontWheel = this.vehicle.addWheel({
        //     localPosition: [0, 0.5] // front
        // });
        // this.frontWheel.setSideFriction(50);

        // // Back wheel
        // this.backWheel = this.vehicle.addWheel({
        //     localPosition: [0, -0.5] // back
        // })
        // this.backWheel.setSideFriction(45) // Less side friction on back wheel makes it easier to drift
//////////////////////////////

        //front wells
        this.frontRightWeel = this.vehicle.addWheel({
            localPosition: [frontRightPosBox.x, frontRightPosBox.y]
        });
        this.frontRightWeel.setSideFriction(9);

        this.frontLeftWeel = this.vehicle.addWheel({
            localPosition: [frontLeftPosBox.x, frontLeftPosBox.y]
        });
        this.frontLeftWeel.setSideFriction(9);

        this.backRightWeel = this.vehicle.addWheel({
            localPosition: [backRightPosBox.x, backRightPosBox.y]
        });
        this.backRightWeel.setSideFriction(9);

        //back wells
        this.backLeftWeel = this.vehicle.addWheel({
            localPosition: [backLeftPosBox.x, backLeftPosBox.y]
        });
        this.backLeftWeel.setSideFriction(9);

/////////////////////////////
    }

    update() {
        // this.contact = 0;
        this.hardwareOn ? this.sensors.updateHardware(this.sensorData) : this.sensors.update()

        // for (var i = 0; i < this.sensorData.length - 1; i++) {
        //     this.sensorData[i] = (this.sensorData[i] + 10)%700
        // }
        // this.sensorData[this.sensorData.length - 1] =
        //     (this.sensorData[this.sensorData.length - 1] + 0.1)%200
    }

    step() {
        this.draw()
    }

    draw() {
        if (this.overlay.visible !== true) {
            return
        }

        this.overlay.clear() 
        this.sensors.draw(this.overlay)
    }

    // handle(throttle, steer) {
    //     // Steer value zero means straight forward. Positive is left and negative right.
    //     this.frontLeftWeel.steerValue = this.maxSteer * steer
    //     this.frontRightWeel.steerValue = this.maxSteer * steer

    //     // Engine force forward
    //     var force = throttle * this.maxEngineForce
    //     if (force < 0) {
    //         if (this.backLeftWeel.getSpeed() > 0.1) {
    //             this.backLeftWeel.setBrakeForce(-throttle * this.maxBrakeForce)
    //             this.backLeftWeel.engineForce = 0.0
    //             this.backRightWeel.setBrakeForce(-throttle * this.maxBrakeForce)
    //             this.backRightWeel.engineForce = 0.0
    //         }
    //         else {
    //             this.backLeftWeel.setBrakeForce(0)
    //             this.backLeftWeel.engineForce = throttle * this.maxBackwardForce
    //             this.backRightWeel.setBrakeForce(0)
    //             this.backRightWeel.engineForce = throttle * this.maxBackwardForce
    //         }
    //     }
    //     else {
    //         this.backLeftWeel.setBrakeForce(0)
    //         this.backLeftWeel.engineForce = force
    //         this.backRightWeel.setBrakeForce(0)
    //         this.backRightWeel.engineForce = force
    //     }

    //     // this.wheels.topLeft.rotation = this.frontLeftWeel.steerValue * 0.7071067812
    //     // this.wheels.topRight.rotation = this.frontLeftWeel.steerValue * 0.7071067812
    // }

    handle(action1, action2) {
        this.action[0] = action1;
        this.action[1] = action2;
        
        var forceLeft = Math.round(action1 * this.maxEngineForce);
        var forceRight = Math.round(action2 * this.maxEngineForce);

        if (!this.hardwareOn || this.manualControlOn ) {
            // if (forceLeft == 0) {
            //     this.frontLeftWeel.setBrakeForce(9)
            //     this.backLeftWeel.setBrakeForce(9)
            // } else {
            //     this.frontLeftWeel.setBrakeForce(0)
            //     this.backLeftWeel.setBrakeForce(0)
            // }

            if (forceLeft > 0) {
                this.frontLeftWeel.engineForce = forceLeft
                this.backLeftWeel.engineForce = forceLeft
            } else {
                this.frontLeftWeel.engineForce = forceLeft
                this.backLeftWeel.engineForce = forceLeft
            }

            // if (forceRight == 0) {
            //     this.frontRightWeel.setBrakeForce(9)
            //     this.backRightWeel.setBrakeForce(9)
            // } else {
            //     this.frontRightWeel.setBrakeForce(0)
            //     this.backRightWeel.setBrakeForce(0)
            // }

            if (forceRight > 0) {
                this.frontRightWeel.engineForce = forceRight
                this.backRightWeel.engineForce = forceRight
            } else {
                this.frontRightWeel.engineForce = forceRight
                this.backRightWeel.engineForce = forceRight
            }
        }

        if (this.hardwareOn && (this.socket.readyState === 1)) {
            let left = (forceLeft * 0.7).toFixed(0);
            let right = (forceRight * 0.7).toFixed(0);
            // if (forceLeft !== 0 || forceRight !== 0) {
                this.socket.send(left + '=' + right + '=;');
                // console.log(forceLeft + '=' + forceRight + '=;');
            // }
        // } else {
           // console.log('socket.readyState !== 1');
        }
    }

    handleKeyInput(k) {
        // To enable control of a car through the keyboard, uncommwent:
        // this.handle((k.getN(38) - k.getN(40)), (k.getN(37) - k.getN(39)))
        if (this.manualControlOn) {
            this.handle((k.getN(87) - k.getN(83)), (k.getN(69) - k.getN(68)))
        }

        if (k.getD(86) === 1) {
            this.overlay.visible = !this.overlay.visible;
        }
    }


    addToWorld(number) {
        // this.chassisBody.position[0] = (Math.random() - .5) * this.world.size.w
        // this.chassisBody.position[1] = (Math.random() - .5) * this.world.size.h
        // this.chassisBody.angle = (Math.random() * 2.0 - 1.0) * Math.PI

        this.chassisBody.position[0] = 0.0
        // this.chassisBody.position[0] = 0.05 * number * this.world.size.w - this.world.size.w/3
        this.chassisBody.position[1] = 0.0
        // this.chassisBody.position[1] = 0.05 * number * this.world.size.h
        this.chassisBody.angle = 0 * Math.PI

        this.world.p2.addBody(this.chassisBody)
        this.vehicle.addToWorld(this.world.p2)

        // this.world.p2.on("beginContact", (event) => {
        //     if ((event.bodyA === this.chassisBody || event.bodyB === this.chassisBody)) {
        //         this.contact++;
        //     }
        // });

        // this.world.p2.on("endContact", (event) => {
        //     if ((event.bodyA === this.chassisBody || event.bodyB === this.chassisBody)) {
        //        this.contact--;
        //     }
        // })

        // this.world.p2.on("impact", (event) => {
        //     if ((event.bodyA === this.chassisBody || event.bodyB === this.chassisBody)) {
        //         this.impact = Math.sqrt(Math.pow(this.chassisBody.velocity[0], 2) + Math.pow(this.chassisBody.velocity[1], 2))
        //     }
        // })
    }

}

Car.ShapeEntity = 2

Car.Sensors = (() => {
    var d = 0.01
    var r = -0.25 + d, l = +0.25 - d
    var b = -0.5 + d, t = +0.5 - d

    return sensors.SensorBlueprint.compile([

        // { type: 'distance', angle: -75, length: 3.5, start: [ 0-0.18, t-0.08 ],  index: 0, contactKoeff: 0.2},
        // { type: 'distance', angle: -45, length: 3.5, start: [ 0-0.13, t-0.04 ], index: 1, contactKoeff: 0.5},
        // { type: 'distance', angle: -15, length: 3.5, start: [ 0-0.05, t ], index: 2, contactKoeff: 1.0},
        // { type: 'distance', angle: +15, length: 3.5, start: [ 0+0.05, t ], index: 3, contactKoeff: 1.0},
        // { type: 'distance', angle: +45, length: 3.5, start: [ 0+0.13, t-0.04 ], index: 4, contactKoeff: 0.5},
        // { type: 'distance', angle: +75, length: 3.5, start: [ 0+0.18, t-0.08 ], index: 5, contactKoeff: 0.2},

        // { type: 'distance', angle: -105, length: 3.5, start: [ 0-0.18, b+0.08 ], index: 6, contactKoeff: 0.2},
        // { type: 'distance', angle: -135, length: 3.5, start: [ 0-0.13, b+0.04 ], index: 7, contactKoeff: 0.5},
        // { type: 'distance', angle: -165, length: 3.5, start: [ 0-0.05, b ], index: 8, contactKoeff: 1.0},
        // { type: 'distance', angle: +165, length: 3.5, start: [ 0+0.05, b ], index: 9, contactKoeff: 1.0},
        // { type: 'distance', angle: +135, length: 3.5, start: [ 0+0.13, b+0.04 ], index: 10, contactKoeff: 0.5},
        // { type: 'distance', angle: +105, length: 3.5, start: [ 0+0.18, b+0.08 ], index: 11, contactKoeff: 0.2},
        { type: 'distance', angle: -75, length: 1.5, start: [ 0-0.18, t-0.08 ],  index: 0, contactKoeff: 1.0},
        { type: 'distance', angle: -45, length: 2.5, start: [ 0-0.13, t-0.04 ], index: 1, contactKoeff: 1.0},
        { type: 'distance', angle: -15, length: 5.5, start: [ 0-0.05, t ], index: 2, contactKoeff: 1.0},
        { type: 'distance', angle: +15, length: 5.5, start: [ 0+0.05, t ], index: 3, contactKoeff: 1.0},
        { type: 'distance', angle: +45, length: 2.5, start: [ 0+0.13, t-0.04 ], index: 4, contactKoeff: 1.0},
        { type: 'distance', angle: +75, length: 1.5, start: [ 0+0.18, t-0.08 ], index: 5, contactKoeff: 1.0},

        // { type: 'distance', angle: -105, length: 1.5, start: [ 0-0.18, b+0.08 ], index: 6, contactKoeff: 0.5},
        { type: 'distance', angle: -135, length: 2.0, start: [ 0-0.13, b+0.04 ], index: 7, contactKoeff: 0.5},
        { type: 'distance', angle: -165, length: 2.5, start: [ 0-0.05, b ], index: 8, contactKoeff: 0.5},
        { type: 'distance', angle: +165, length: 2.5, start: [ 0+0.05, b ], index: 9, contactKoeff: 0.5},
        { type: 'distance', angle: +135, length: 2.0, start: [ 0+0.13, b+0.04 ], index: 10, contactKoeff: 0.5},
        // { type: 'distance', angle: +105, length: 1.5, start: [ 0+0.18, b+0.08 ], index: 11, contactKoeff: 0.5},

        { type: 'speed' }

    ])
})()

module.exports = Car;