class Elevator {
    constructor(id, currentFloor) {
        this.id = id;
        this.currentFloor = currentFloor;
        this.direction = 0; // 0表示静止，1表示上行，-1表示下行
        this.requests = new Set(); // 存储电梯当前的请求
        this.destinations = []; // 存储电梯内部乘客的目标楼层
    }

    move() {
        if (this.requests.size === 0 && this.destinations.length === 0) return; // 如果没有请求，电梯静止

        // 移动电梯
        if (this.direction === 1) {
            this.currentFloor++;
        } else if (this.direction === -1) {
            this.currentFloor--;
        }

        console.log(`Elevator ${this.id} is at floor ${this.currentFloor}`);

        // 到达目标楼层，移除该楼层的请求
        if (this.requests.has(this.currentFloor)) {
            this.requests.delete(this.currentFloor);
            console.log(`Elevator ${this.id} stopped at floor ${this.currentFloor}`);
        }

        // 到达乘客目标楼层，移除该楼层的目标
        if (this.destinations.includes(this.currentFloor)) {
            this.destinations = this.destinations.filter(floor => floor !== this.currentFloor);
            console.log(`Elevator ${this.id} arrived at destination floor ${this.currentFloor}`);
        }

        // 改变方向
        if (this.requests.size === 0 && this.destinations.length === 0) {
            this.direction = 0; // 电梯停止
        } else {
            if (this.currentFloor === 1) {
                this.direction = 1; // 到达最低楼层，改为上行
            } else if (this.currentFloor === 12) {
                this.direction = -1; // 到达最高楼层，改为下行
            }
        }
    }

    addRequest(floor) {
        if (floor === this.currentFloor) return; // 如果请求楼层就是当前楼层，不添加
        if (floor > 12 || floor < 1) return; // 无效楼层
        this.requests.add(floor);
        if (this.direction === 0) {
            // 电梯当前静止，根据请求位置决定移动方向
            this.direction = floor > this.currentFloor ? 1 : -1;
        }
    }

    addDestination(floor) {
        if (floor === this.currentFloor) return; // 如果目标楼层就是当前楼层，不添加
        if (floor > 12 || floor < 1) return; // 无效楼层
        this.destinations.push(floor);
        if (this.direction === 0) {
            // 电梯当前静止，根据目标位置决定移动方向
            this.direction = floor > this.currentFloor ? 1 : -1;
        }
    }
}

class ElevatorController {
    constructor() {
        this.elevators = [];
        for (let i = 1; i <= 6; i++) {
            this.elevators.push(new Elevator(i, 1)); // 所有电梯初始都在第1层
        }
        // self = self_outer; // 外部的this
        // console.log(self);
    }

    requestElevator(floor) {
        // 找到距离最近的电梯
        let nearestElevator = this.elevators[0];
        let minDistance = Math.abs(nearestElevator.currentFloor - floor);
        for (let elevator of this.elevators) {
            let distance = Math.abs(elevator.currentFloor - floor);
            if (distance < minDistance) {
                minDistance = distance;
                nearestElevator = elevator;
            }
        }
        nearestElevator.addRequest(floor);
        console.log(`Elevator ${nearestElevator.id} received request from floor ${floor}`);
    }

    requestFloor(elevatorId, floor) {
        const elevator = this.elevators.find(elevator => elevator.id === elevatorId);
        if (elevator) {
            elevator.addDestination(floor);
            console.log(`Elevator ${elevatorId} received request to go to floor ${floor}`);
        } else {
            console.log(`Elevator ${elevatorId} does not exist.`);
        }
    }

    start() {
        setInterval(() => {
            for (let elevator of this.elevators) {
                elevator.move();
            }
        }, 2000); // 每2秒执行一次电梯移动操作
    }
}




const ElevatorModule = {
    Elevator,
    ElevatorController
};

export default ElevatorModule;