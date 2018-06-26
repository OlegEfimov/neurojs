var color = require('./color.js'),
    sensors = require('./sensors.js'),
    tc = require('./tiny-color.js');

class Car {

    constructor(world, opt) {
        this.maxSteer = Math.PI / 7
        this.maxEngineForce = 10
        this.maxBrakeForce = 5
        this.maxBackwardForce = 2
        this.linearDamping = 0.5

        this.contact = 0
        this.impact = 0

        this.world = world

        this.init()
    }

    init() {
        this.createPhysicalBody()

        this.sensors = Car.Sensors.build(this)
        this.speed = this.sensors.getByType("speed")[0]
    }

    createPhysicalBody() {
        // Create a dynamic body for the chassis
        this.chassisBody = new p2.Body({
            mass: 1,
            damping: 0.2,
            angularDamping: 0.3,
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
        this.chassisBody.gl_create = (function (sprite, r) {
            this.overlay = new PIXI.Graphics();
            this.overlay.visible = true;

            sprite.addChild(this.overlay);

            var wheels = new PIXI.Graphics()
            sprite.addChild(wheels)

            var w = 0.12, h = 0.22
            var space = 0.07
            var col = "#" + this.chassisBody.color.toString(16)
                col = parseInt(tc(col).darken(50).toHex(), 16)
            var alpha = 0.35, alphal = 0.9

            var tl = new PIXI.Graphics()
            var tr = new PIXI.Graphics()

            tl.beginFill(col, alpha)
            tl.position.x = -0.25
            tl.position.y = 0.5 - h / 2 - space
            tl.drawRect(-w / 2, -h / 2, w, h)
            tl.endFill()

            tr.beginFill(col, alpha)
            tr.position.x = 0.25
            tr.position.y = 0.5 - h / 2 - space
            tr.drawRect(-w / 2, -h / 2, w, h)
            tr.endFill()

            this.wheels.topLeft = tl
            this.wheels.topRight = tr

            wheels.addChild(tl)
            wheels.addChild(tr)

            wheels.beginFill(col, alpha)
            // wheels.lineStyle(0.01, col, alphal)
            wheels.drawRect(-0.25 - w / 2, -0.5 + space, w, h)
            wheels.endFill()

            wheels.beginFill(col, alpha)
            // wheels.lineStyle(0.01, col, alphal)
            wheels.drawRect(0.25 - w / 2, -0.5 + space, w, h)
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
        this.frontLeftWeel = this.vehicle.addWheel({
            localPosition: [-0.5, 0.5]
        });
        this.frontLeftWeel.setSideFriction(9);

        this.frontRightWeel = this.vehicle.addWheel({
            localPosition: [0.5, 0.5]
        });
        this.frontRightWeel.setSideFriction(9);

        //back wells
        this.backLeftWeel = this.vehicle.addWheel({
            localPosition: [-0.5, -0.5]
        });
        this.backLeftWeel.setSideFriction(9);

        this.backRightWeel = this.vehicle.addWheel({
            localPosition: [0.5, -0.5]
        });
        this.backRightWeel.setSideFriction(9);


/////////////////////////////
    }

    update() {
        this.sensors.update()
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
        var forceLeft = action1 * this.maxEngineForce
        var forceRight = action2 * this.maxEngineForce

        if (forceLeft == 0) {
            this.frontLeftWeel.setBrakeForce(9)
            this.backLeftWeel.setBrakeForce(9)
        } else {
            this.frontLeftWeel.setBrakeForce(0)
            this.backLeftWeel.setBrakeForce(0)
        }

        this.frontLeftWeel.engineForce = forceLeft
        this.backLeftWeel.engineForce = forceLeft

        if (forceRight == 0) {
            this.frontRightWeel.setBrakeForce(9)
            this.backRightWeel.setBrakeForce(9)
        } else {
            this.frontRightWeel.setBrakeForce(0)
            this.backRightWeel.setBrakeForce(0)
        }

        this.frontRightWeel.engineForce = forceRight
        this.backRightWeel.engineForce = forceRight

    }

    handleKeyInput(k) {
        // To enable control of a car through the keyboard, uncomment:
        // this.handle((k.getN(38) - k.getN(40)), (k.getN(37) - k.getN(39)))
        this.handle((k.getN(87) - k.getN(83)), (k.getN(69) - k.getN(68)))

        if (k.getD(86) === 1) {
            this.overlay.visible = !this.overlay.visible;
        }
    }


    addToWorld(number) {
        // this.chassisBody.position[0] = (Math.random() - .5) * this.world.size.w
        // this.chassisBody.position[1] = (Math.random() - .5) * this.world.size.h
        // this.chassisBody.angle = (Math.random() * 2.0 - 1.0) * Math.PI
        this.chassisBody.position[0] = 0.05 * number * this.world.size.w
        this.chassisBody.position[1] = 0.05 * number * this.world.size.h
        this.chassisBody.angle = 0 * Math.PI

        this.world.p2.addBody(this.chassisBody)
        this.vehicle.addToWorld(this.world.p2)

        this.world.p2.on("beginContact", (event) => {
            if ((event.bodyA === this.chassisBody || event.bodyB === this.chassisBody)) {
                this.contact++;
            }
        });

        this.world.p2.on("endContact", (event) => {
            if ((event.bodyA === this.chassisBody || event.bodyB === this.chassisBody)) {
               this.contact--;
            }
        })

        this.world.p2.on("impact", (event) => {
            if ((event.bodyA === this.chassisBody || event.bodyB === this.chassisBody)) {
                this.impact = Math.sqrt(Math.pow(this.chassisBody.velocity[0], 2) + Math.pow(this.chassisBody.velocity[1], 2))
            }
        })
    }

}

Car.ShapeEntity = 2

Car.Sensors = (() => {
    var d = 0.05
    var r = -0.25 + d, l = +0.25 - d
    var b = -0.50 + d, t = +0.50 - d

    return sensors.SensorBlueprint.compile([

        { type: 'distance', angle: -45, length: 5, start: [ r, t ] },
        { type: 'distance', angle: -30, length: 5, start: [ 0, t ] },
        { type: 'distance', angle: -15, length: 5, start: [ 0, t ] },
        { type: 'distance', angle: +00, length: 5, start: [ 0, t ] },
        { type: 'distance', angle: +15, length: 5, start: [ 0, t ] },
        { type: 'distance', angle: +30, length: 5, start: [ 0, t ] },
        { type: 'distance', angle: +45, length: 5, start: [ l, t ]  },

        { type: 'distance', angle: +135, length: 5, start: [ l, b ]  },
        { type: 'distance', angle: +165, length: 5, start: [ 0, b ]  },
        { type: 'distance', angle: -180, length: 5, start: [ 0, b ]  },
        { type: 'distance', angle: -165, length: 5, start: [ 0, b ]  },
        { type: 'distance', angle: -135, length: 5, start: [ r, b ]  },

        { type: 'distance', angle: -10, length: 10, start: [ 0, t ]  },
        { type: 'distance', angle: -03, length: 10, start: [ 0, t ]  },
        { type: 'distance', angle: +00, length: 10, start: [ 0, t ]  },
        { type: 'distance', angle: +03, length: 10, start: [ 0, t ]  },
        { type: 'distance', angle: +10, length: 10, start: [ 0, t ]  },

        { type: 'distance', angle: +60, length: 5, start: [ l, 0 ]  },
        { type: 'distance', angle: +90, length: 5, start: [ l, 0 ]  },
        { type: 'distance', angle: +120, length: 5, start: [ l, 0 ]  },

        { type: 'distance', angle: -60, length: 5, start: [ r, 0 ]  },
        { type: 'distance', angle: -90, length: 5, start: [ r, 0 ]  },
        { type: 'distance', angle: -120, length: 5, start: [ r, 0 ]  },

        { type: 'speed' },

    ])
})()

module.exports = Car;