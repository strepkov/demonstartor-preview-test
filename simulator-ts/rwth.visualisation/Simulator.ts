import * as math from "../libs/math.js";
import {Car} from "./car/Car";
import {Orientation} from "./coord/Orientation";
import {Sinput} from "./Sinput"
import {Soutput} from "./Soutput"
import {Track} from "./track/Track";
import {ControllerMock} from "./ControllerMock";

export {Simulator}

class Simulator {

//private generator: MontiarcToJavaGenerator;

    // fps = 1/s -> fpsTime is 1/fps
    public fpsTime;
    private velocity;
    private time;
    private car: Car;
    private track: Track;
    private output: Soutput; //stores the output data(new positions, degree, velocity etc.)

    public constructor() {

        // Initial velocity is 0 m/s, Initial time is 0 s
        this.velocity = math.unit('0 m/s'); // v - m/s
        this.time = math.unit('0 sec'); // t
        this.fpsTime = math.unit('1 sec');
        
        this.car = new Car(0,0);
        this.track = new Track();
    }

    // Updates the time, velocity, degree of car and new positions x,y
    public calculate(input: Sinput) {
        
        // time = t+(1/20)s, for t=0s
        this.time = math.add(this.time, this.fpsTime);
        
        // velocity = v+(input)acceleration*(1/20)s, for v=0 m/ss

        // if (cond){
             this.velocity = math.unit('14 km/h');
        // }
        // else {
        //     this.velocity = math.add(this.velocity, math.multiply(input.acceleration, this.fpsTime));
        // }
        
        // math.add(this.velocity, math.multiply(input.acceleration, this.fpsTime)) < math.unit('10 m/s')) ? 
        //     this.velocity = math.unit('10 m/s') :
        //     this.velocity = math.add(this.velocity, math.multiply(input.acceleration, this.fpsTime));

        let degree;
        // calculation of car rotation
        if(this.velocity.equals(math.unit('0 m/s'))){

             degree = this.car.getDegree();
        }
        else{

            degree = math.add(this.car.getDegree(), input.steering); // adjust steeriing angle
        }

        //Calculate positioin of the car
        // x=(input)x+v*t*cos((rad)degree) // degree * Math.PI / 180 - radian conversioin
        let x = math.add(input.x0, math.multiply(this.velocity, math.multiply(this.fpsTime, math.cos(degree))));

        // y=(input)y+v*t*sin((rad)degree) //Amount<Length>
        let y = math.subtract(input.y0, math.multiply(this.velocity, math.multiply(this.fpsTime, math.sin(degree))));

        this.output = new Soutput(
            this.velocity,
            x,
            y,
            this.time,
            degree,
            input.doorStatus,
            input.indicatorStatus,
            input.lightTimerStatus,
            input.triggerStatus);
    }

    // send the updated position and the degree to the visualization

    public run() {

        let distances: number[] = this.car.getDistancesFromSensors(this.track);

        let steering_controller = ControllerMock.steering(distances); // steering angle
        let acceleration_controller = ControllerMock.acceleration(this.time); // constant velocity

        let input: Sinput = new Sinput(
                
            acceleration_controller, // a
            steering_controller,  // s
            math.unit('0 m'), // x
            math.unit('0 m'), // y
            this.time, // t
            false, // doorStatus
            false, //indicatorStatus
            false, //lightStatus
            false //triggerStatus
        );
    
        this.calculate(input);

        // Give the updated t and v to the Generator/BasicSimulator and next loop

        let trigger = false;

        while(!trigger) {

            trigger = ControllerMock.gameOverTrigger(this.output.xi.value, this.output.yi.value);

            this.car.setPosition([this.output.xi.value, this.output.yi.value]);
            this.car.setDegree(this.output.degree);

            console.log(
                        "\n X :",this.output.xi.value,
                        "\n Y :", this.output.yi.value,
                        "\n T :", this.output.ti.value,
                        "\n D :", this.output.degree.value * 180 / math.PI,
                    );

            // create input generated by controller
            // fill input with tha data from controller

            let distances1: number[] = this.car.getDistancesFromSensors(this.track);

            let steering_controller1 = ControllerMock.steering(distances1); // steering angle
            let acceleration_controller1 = ControllerMock.acceleration(this.time); // constant velocity

            input = new Sinput(
                acceleration_controller1, //acceleration
                steering_controller1, // steering, DEGREE_ANGLE
                this.output.xi,
                this.output.yi,
                this.output.ti,
                false, //doorStatus
                false, //indicatorStatus
                false, //lightStatus
                false  //triggerStatus
            );

            this.calculate(input);
        }
    }
}
