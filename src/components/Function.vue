<script setup>
import { ref } from "vue";
class Elevator {
  //bug :有时候同一个楼层会出现相同的数字...在floor_peo中
  constructor(id, currentFloor, floor_peo, call_direction, controller) {
    this.id = id;
    this.currentFloor = currentFloor;
    this.floor_peo = floor_peo; // 楼层人员
    this.controller = controller; // 控制器
    this.call_direction = call_direction; // 楼层的呼叫方向
    this.direction = 0; // 0表示静止，1表示上行，-1表示下行
    this.capacity = 8; // 电梯容量
    this.destinations = []; // 存储电梯内部乘客的目标楼层
    this.doorOpenTime = 1000; // 电梯开门时间（ms）
    this.floorTravelTime = 2000; // 电梯在楼层间移动时间（ms）
    this.state = 0; // 0代表正常运行, 1代表正在前往某一个楼层, 2代表是开门中, 3代表预备电梯!!!
    this.destination_floor = 0; // 目标楼层, 只有在this.state == 1 才有效 从0 - 11
  }

  move() {
    if (this.state == 3) {
      if (this.destination_floor == this.currentFloor) {
        // 已经到达指定楼层,进行开门接客
        // 不动
      } else {
        this.direction =
          this.destination_floor - this.currentFloor > 0 ? 1 : -1; // 设置新方向
        if (this.direction === 1) {
          // 移动
          ++this.currentFloor;
        } else if (this.direction === -1) {
          --this.currentFloor;
        }
      }
    } else if (this.state == 1) {
      // 第一种,让电梯前往起始点,接乘客
      // console.log("第一个数为" + this.destination_floor + "第二个数为" + this.currentFloor);
      if (this.destination_floor == this.currentFloor) {
        // 已经到达指定楼层,进行开门接客

        if (this.floor_peo.value[11 - this.destination_floor].length == 0) {
          // 没有人,则进行修改状态,让控制器可以控制
          this.setStatic();
        } else {
          this.direction =
            this.floor_peo.value[11 - this.destination_floor][0] -
              this.currentFloor >
            0
              ? 1
              : -1; // 第一个顾客就是电梯的方向!!!!
          // 这里接客......
          this.openDoor();
          this.state = 0;
          // return
        }
      } else {
        this.direction =
          this.destination_floor - this.currentFloor > 0 ? 1 : -1; // 设置新方向
        if (this.direction === 1) {
          // 移动
          ++this.currentFloor;
        } else if (this.direction === -1) {
          --this.currentFloor;
        }
      }
    } else {
      // 第二种,起始点后,在前往终点的过程,也接上下乘客
      if (this.destinations.length != 0 && this.state != 1) {
        if (this.currentFloor === 0) {
          this.direction = 1; // 到达最低楼层，改为上行
        } else if (this.currentFloor === 11) {
          this.direction = -1; // 到达最高楼层，改为下行
        }

        let dir_call = this.direction == 1 ? 0 : 1; // 上行的数组为0, 下行的数组为1

        // 到达乘客目标楼层 或 该楼层有人员呼叫与电梯方向相同
        if (
          this.destinations.includes(this.currentFloor) ||
          this.call_direction[11 - this.currentFloor][dir_call] == 1
        ) {
          this.openDoor();
          // 如果电梯已经满载且该楼层还有相同方向的人,请控制器来调一台电梯上来.
          // return;
        }

        if (this.direction === 1) {
          this.currentFloor++;
        } else if (this.direction === -1) {
          this.currentFloor--;
        }
      } else {
        // 已经任务
        this.setStatic();
      }
    }

    setTimeout(() => {
      this.move();
    }, this.floorTravelTime);
  }

  openDoor() {
    this.state = 2;
    // 先出人!!
    // console.log("当前处于的楼层" + (this.currentFloor+1));
    this.destinations = this.destinations.filter(
      (floor) => floor !== this.currentFloor
    );

    let reserve = ref([]);
    let del_call = true;
    // 按照电梯的方向,来进人!

    for (
      let i = 0;
      i < this.floor_peo.value[11 - this.destination_floor].length;
      ++i
    ) {
      // console.log("哪一楼进行拿数组" + (11 - this.destination_floor) );

      let peo_direction =
        this.floor_peo.value[11 - this.destination_floor][i] -
          this.currentFloor >
        0
          ? 1
          : -1;
      if (peo_direction == this.direction && this.destinations.length < 8) {
        // 方向一样则进入!
        this.destinations.push(floor_peo.value[11 - this.destination_floor][i]);
      } else {
        reserve.value.push(
          this.floor_peo.value[11 - this.destination_floor][i]
        ); // 剩余的人
        // if(peo_direction == this.direction) {
        //     del_call = false; // 不删除这个呼叫
        // }
      }
    }
    this.floor_peo.value[11 - this.destination_floor] = reserve.value; //更换

    let del_up = true;
    let del_down = true;
    for (let i = 0; i < reserve.length; ++i) {
      let peo_direction =
        this.floor_peo.value[11 - this.destination_floor][i] -
          this.currentFloor >
        0
          ? 1
          : -1;
      if (peo_direction == 1) {
        del_up = false;
      } else {
        del_down = false;
      }
    }

    // 去掉呼叫问题!
    if (del_up && this.call_direction[this.destination_floor][0] == 1) {
      this.call_direction[this.destination_floor][0] = 0; // 取消呼叫
      // console.log("已经把第" + (this.destination_floor + 1) + "楼呼叫取消");
    }

    if (del_down && this.call_direction[this.destination_floor][1] == 1) {
      this.call_direction[this.destination_floor][1] = 0; // 取消呼叫
      // console.log("已经把第" + (this.destination_floor + 1) + "楼呼叫取消");
    }

    // setTimeout(() => {
    //     this.move();
    //     this.state = 0;
    // }, this.doorOpenTime);
  }

  addDestination(floor) {
    // 设置电梯前往的目的
    this.state = 1;
    this.destination_floor = floor;
  }

  setStatic() {
    this.state = 0;
    this.direction = 0;
    // 呼叫控制器,让控制查找
  }

  setPreEleva(floor) {
    this.state = 3;
    this.destination_floor = floor;
  }
}

class ElevatorController {
  constructor(floor_peo) {
    // this.upwait_tree = new Set();// 上行的等待树
    // this.downwait_tree = new Set(); // 下行的等待树
    // this.had_dispatch_up = new Set();
    // this.had_dispatch_down = new Set();

    this.call_direction = []; // 存储着楼层情况[ [0,0],...,[0,0] ] 第一个为up呼叫,第二个为down呼叫
    for (let i = 1; i <= 12; ++i) {
      let arr = [0, 0]; // 楼层的呼叫情况
      this.call_direction.push(arr);
    }
    this.elevators = [];
    for (let i = 1; i <= 6; i++) {
      this.elevators.push(
        new Elevator(
          i,
          getRandomInt(11, 0),
        // 0,
          floor_peo,
          this.call_direction,
          this
        )
      ); // 初始化电梯
    }
  }

  // 新来的人员,我们进行判断, 在哪一楼,方向
  addPeopleCall(floor, direction) {
    // if(direction == 0) { // 向上方向
    //     upwait_tree.add(floor)
    // }else {
    //     downwait_tree.add(floor)
    // }

    this.call_direction[floor][direction] = 1;
    this.dispatchElevator(floor);
  }

  // 分配电梯!!
  dispatchElevator(floor) {
    // 新来一个,我们之间让有空闲的电梯前往!
    let elevator_index = null;
    for (let i = 0; i < 6; ++i) {
      // 寻找是否有空闲的电梯!!
      if (this.elevators[i].state == 0 && this.elevators[i].direction == 0) {
        elevator_index = i;
        break;
      }
    }
    if (elevator_index != null) {
      // console.log("分配电梯" + elevator_index + "号电梯" + "前往第" + (floor + 1) + "楼层");
      this.elevators[elevator_index].addDestination(floor);
    }
  }

  start() {
    for (let elevator of this.elevators) {
      elevator.move();
    }

    // 定时呼叫电梯!
    // setInterval(() =>{
    // // 判断有多少台电梯空闲,有多少台电梯上行,有多少台电梯下行? 在进行upwait_tree,downwait_tree长度来进行增加!
    //     let leizi = []
    //     let goUp = []
    //     let goDown = []
    //     for (let i=0;i<6;++i) {
    //         // 寻找是否有空闲的电梯!!
    //         if(this.elevators[i].direction == 0) {
    //             leizi.push(i);
    //         }else if(this.elevators[i].direction == 1) {
    //             goUp.push(i);
    //         }else if(this.elevators[i].direction == -1) {
    //             goDown.push(i);
    //         }
    //     }
    //     if(leizi.length != 0) { // 得有空闲才分配
    //         if (this.upwait_tree.size != 0) { // 应该给goUp增加
    //             // this.dispatchElevator(this.upwait_tree)
    //             const myIterator = this.upwait_tree.values();
    //             // 从最大的出发
    //             let floor = 1;
    //             for (const entry of myIterator) {
    //                 floor = Math.max(floor, entry)
    //             }

    //         }else if(this.downwait_tree.size != 0) { // 给goDown增加

    //         }
    //     }
    // }, 200)
  }
}

var input = ref(0);
var peoQuantity = ref("much");
var workDay = ref("yes");
var workTime = ref("gowork");
var floor_peo = ref([[], [], [], [], [], [], [], [], [], [], [], []]);
const controller = new ElevatorController(floor_peo); // 初始电梯控制台
var time = ref("7:00 - 8:00   上班高峰期,正常调度");

var text = "人流量多时，采用直接调度方法，增加吞吐量";

function changeFun() {
  // 控制台的大确认
  // 让所有电梯都停止,清除楼层所有数据!
  // for (let i=0;i<floor_peo.value.length;++i) {
  //     console.log("!!!");
  //     floor_peo.value[i] = [];
  // }

  for (let i = 0; i < 6; ++i) {
    controller.elevators[i].direction = 0;
    controller.elevators[i].destinations = [];
    controller.elevators[i].state = 0;
    controller.elevators[i].destination_floor = 0;
  }

  console.log(peoQuantity);
  if (peoQuantity.value == "much") {
    // 常规调用
    // console.log("1111");
    text = "人流量多时，采用直接调度方法，增加吞吐量";
  } else if (peoQuantity.value == "few") {
    // console.log("000000");
    if (workDay.value == "yes") {
      // console.log("11111");
      if (workTime.value == "gowork") {

        // floor_peo.value[7] = [0,3,1];
        // floor_peo.value[3] = [1,6,9];


        text = "人流量少时且在上班时期，我们将三台电梯移动到1楼等待";
        console.log("22222");
        // 把3台电梯调到1楼过去等
        controller.elevators[1].state = 3;
        controller.elevators[1].destination_floor = 0;

        controller.elevators[2].state = 3;
        controller.elevators[2].destination_floor = 0;

        controller.elevators[5].state = 3;
        controller.elevators[5].destination_floor = 0;
        time = ref('8:30 - 11:00  工作期间,人流量较少,电梯自适应调度')
        


      } else if (workTime.value == "gohome") {
        // 把1台电梯调取4楼, 7楼, 11楼
        text =
          "人流量少时且在下班时期，我们将三台电梯移动到4楼、7楼、11楼进行等待";

       

        // for (let i = 0; i < 20; ++i) {
        //     var floor_add = getRandomInt(6, 0); // 那一个楼层增加
        //     var go_floor = getRandomInt(11, 0);
        //     if (floor_peo.value[floor_add].length < 8 && go_floor != (11 - floor_add)) {
        //         floor_peo.value[floor_add].push(go_floor);
        //         let direction_call = go_floor - floor_add > 0 ? 0 : 1; // 为正数则为up,为负数则为down
        //         controller.addPeopleCall(11 - floor_add, direction_call); // 人员分配
        //     }
        // }




        controller.elevators[0].state = 3;
        controller.elevators[0].destination_floor = 3;

        controller.elevators[1].state = 3;
        controller.elevators[1].destination_floor = 6;

        controller.elevators[3].state = 3;
        controller.elevators[3].destination_floor = 10;

        time = ref('11:00 - 11:30  下班高峰期,电梯自适应调度')
      }
    } else if (workDay.value == "no") {
      // 预测以前人流,把1台电梯调取6楼, 1楼
      text =
        "人流量少时且不在工作时，根据以往数据，我们将两台电梯移动到1楼、6楼";



      controller.elevators[1].state = 3;
      controller.elevators[1].destination_floor = 0;

      controller.elevators[4].state = 3;
      controller.elevators[4].destination_floor = 5;
    }
  }
}

controller.start();
// 模拟现实，楼层呼叫的问题！！

// for (let i = 0; i < 8; ++i) {
// //   var floor_add = getRandomInt(11, 0); // 那一个楼层增加
//   var go_floor = getRandomInt(11, 0);
//   if (floor_peo.value[11].length < 8 && go_floor != 0) {
//     floor_peo.value[11].push(go_floor);
//     let direction_call = go_floor - 11 > 0 ? 0 : 1; // 为正数则为up,为负数则为down
//     controller.addPeopleCall(0, direction_call); // 人员分配
//   }
// }

// for (let i = 0; i < 3; ++i) {
// //   var floor_add = getRandomInt(11, 0); // 那一个楼层增加
//   var go_floor = getRandomInt(11, 0);
//   if (floor_peo.value[10].length < 8 && go_floor != 10) {
//     floor_peo.value[10].push(go_floor);
//     let direction_call = go_floor - 10 > 0 ? 0 : 1; // 为正数则为up,为负数则为down
//     controller.addPeopleCall(1, direction_call); // 人员分配
//   }
// }



for (let i = 0; i < 20; ++i) {
  var floor_add = getRandomInt(11, 0); // 那一个楼层增加
  var go_floor = getRandomInt(11, 0);
  if (floor_peo.value[floor_add].length < 8 && go_floor != (11 - floor_add)) {
    floor_peo.value[floor_add].push(go_floor);
    let direction_call = go_floor - floor_add > 0 ? 0 : 1; // 为正数则为up,为负数则为down
    controller.addPeopleCall(11 - floor_add, direction_call); // 人员分配
  }
}

setInterval(function () {
  // console.log('添加数据');
  if (true) {
    // 也就是人流量多的情况，进行分配
    var floor_add = getRandomInt(11, 0); // 那一个楼层增加
    var go_floor = getRandomInt(11, 0);
    if (floor_peo.value[floor_add].length < 8 && go_floor != floor_add) {
      floor_peo.value[floor_add].push(go_floor);
      let direction_call = go_floor - floor_add > 0 ? 0 : 1; // 为正数则为up,为负数则为down
      controller.addPeopleCall(11 - floor_add, direction_call); // 人员分配
    }
  }
  // 进行调度分配
}, 2000);

function getRandomInt(max, min) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
</script>

<template>
  <div class="page">
    <div class="floor">
      <div class="i_12" v-for="(item, indexs) in floor_peo" :key="indexs">
        <div class="head">{{ 12 - indexs }}</div>
        <div
          class="people"
          v-for="(content, index) in floor_peo[indexs]"
          :key="index"
        >
          {{ content + 1 }}
        </div>
      </div>
    </div>
    <div class="middle">
      <div class="pre_peo">
        <div class="title" style="font-size: 23px;">时间: {{ time }}</div>
        <div class="contain"></div>
      </div>
      <div class="show_el">
        <div>电梯展示：</div>

        <div class="show_color">
          <div>黑色: 正常运行</div>
          <div style="color: #409eff">蓝色: 预备等待</div>
        </div>

        <!-- controller.elevators[1].currentFloor -->
        <div class="show_contain">
          <div
            class="ele"
            v-for="(item, index) in controller.elevators"
            :key="index"
            :class="item.state == 3 ? 'blue' : ''"
          >
            <div class="text_1">电梯所在楼层:{{ item.currentFloor + 1 }}</div>
            <!-- <div class="text_1">现有目的: {{ item.destinations }}</div>
                    <div class="text_1">方向: {{item.direction}}</div>
                    <div class="text_1">状态: {{item.state}}</div>
                    <div class="text_1">目标楼层: {{item. destination_floor + 1}}</div> -->

            <div class="number">({{ index + 1 }})</div>
          </div>
        </div>
      </div>
    </div>
    <div class="control">
      <div class="con_title" style="visibility: hidden">控制台</div>
      <div class="line"></div>
      <div class="momo">
        <div class="con_title">控制台</div>
        <!-- <div class="mono_text">紧急需求  楼层：</div>
            <el-input class="mono_numb" v-model="input"  />
            <el-button class="mono_btn" type="primary" plain>确认</el-button> -->
      </div>
      <div class="line"></div>
      <div class="momo">
        <div class="mono_text">人流量：</div>
        <el-radio-group v-model="peoQuantity" size="large">
          <el-radio-button label="多" value="much" />
          <el-radio-button label="少" value="few" />
        </el-radio-group>
      </div>
      <div :class="peoQuantity == 'few' ? 'show' : 'hidden'">
        <div class="momo">
          <div class="mono_text">是否为工作日：</div>
          <el-radio-group v-model="workDay" size="large">
            <el-radio-button label="是" value="yes" />
            <el-radio-button label="否" value="no" />
          </el-radio-group>
        </div>

        <div class="select_box" :class="workDay == 'yes' ? 'show' : 'hidden'">
          <el-radio-group v-model="workTime" size="large">
            <el-radio-button label="上班时期" value="gowork" />
            <el-radio-button label="下班时期" value="gohome" />
          </el-radio-group>
        </div>
      </div>
      <div class="btn-contain">
        <el-button type="primary" size="large" class="btn" @click="changeFun"
          >确认</el-button
        >
      </div>
      <div class="line"></div>
      <div>{{ text }}</div>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100vw;
  height: 100vh;
  display: flex;
}
.floor {
  width: 20%;
  height: 100%;
}
.floor > div {
  width: 120px;
  height: 54px;
  margin: 4px 0;
  border: 2px solid #000;
  margin-left: 140px;
  display: flex;
  padding: 2px;
  position: relative;
  flex-flow: wrap;
}
.people {
  width: 20px;
  height: 22px;
  text-align: center;
  border: 1px solid #409eff;
  /* background: yellow; */
  margin: 1px 4px;
}
.head {
  position: absolute;
  top: 10px;
  left: -24px;
}

.middle {
  width: 50%;
  height: 100%;
}
.pre_peo {
  width: 100%;
  height: 200px;
  /* visibility: hidden; */
}
.title {
  padding: 40px 0 0 60px;
}
.contain {
}

.show_el {
  width: 100%;
  height: 360px;
  position: relative;
}
.show_color {
  position: absolute;
  width: 100px;
  height: 100px;
  /* background: #000; */
  top: -10px;
  right: 60px;
}
.show_contain {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 40px 50px;
  display: flex;
  flex-flow: wrap;
}
.ele {
  width: 140px;
  height: 90px;
  margin: 20px;
  /* background: #000; */
  position: relative;
  border: 2px solid #000;
  display: flex;
  flex-direction: column;
  /* overflow: hidden; */
}
.ele > :first-child {
  width: 100%;
  height: 80%;
  /* width: 20%;
    height: 20%; */
  /* background: yellow; */
  font-size: 18px;
  text-align: center;
  line-height: 70px;
}
.number {
  width: 100%;
  height: 24%;
  /* background: #000; */
  text-align: center;
}
.blue {
  border: 1px solid #409eff;
}

.control {
  width: 30%;
  height: 100%;
}
.con_title {
  font-size: 30px;
  width: 100%;
  height: 70px;
  text-align: center;
  line-height: 70px;
}
.line {
  width: 100%;
  height: 5px;
  background: #000;
}
.momo {
  width: 100%;
  height: 100px;
  /* background: yellow; */
  display: flex;
  align-items: center;
}
.mono_text {
  font-size: 30px;
}
.mono_numb {
  width: 60px;
  display: block;
  text-align: center;
}
.mono_btn {
  width: 50px;
  margin-left: 20px;
}
.select_box {
  width: 100%;
  display: flex;
  justify-content: center;
}
.hidden {
  visibility: hidden;
}
.btn-contain {
  margin-top: 20px;
  margin-bottom: 30px;
  width: 100%;
  display: flex;
  justify-content: center;
}
.btn {
  width: 310px;
  letter-spacing: 4px;
}
</style>
