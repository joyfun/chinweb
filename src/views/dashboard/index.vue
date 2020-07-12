<template>
  <div class="main">
    <el-row :gutter="10">
      <div
        class="app-container"
        style="height: calc( 100vh - 100px);padding: 0; min-height: 31rem;"
      >
        <div class="info">
          <div class="graphics">
            <div class="icon">
              <i class="clouds" />
              <p>云端</p>
            </div>
            <div class="speed">
              <p>
                <i class="el-icon-top" />
                <span>
                  {{ dataInPerSecond }}
                  <span class="unit">K/s</span>
                </span>
              </p>
              <p>
                <i class="el-icon-bottom" />
                <span>
                  {{ dataOutPerSecond }}
                  <span class="unit">K/s</span>
                </span>
              </p>
            </div>
            <div class="icon">
              <i class="route" />
              <p>我的路由器</p>
            </div>
            <div class="type">
              <p :class="{ run: modbus}">
                <span>modbus</span>
              </p>
              <p :class="{ run: bacnet}">
                <span>bacnet</span>
              </p>
            </div>
            <div class="icon">
              <i class="device" />
              <p>传感设备</p>
            </div>
          </div>
          <p class="infoTotal">License info 许可信息使用量统计：已用/总计 {{ infoShould }}/{{ infoTotal }}</p>
          <el-row>
            <el-col :span="8">
              <p>系统启动时间</p>
              <p>{{ $moment(startTime).format('YYYY-MM-DD HH:mm:ss') }}</p>
            </el-col>
            <el-col :span="8">
              <p>系统运行时长</p>
              <p class="text">{{ runningTime }}</p>
              <div class="line" />
            </el-col>
            <el-col :span="8">
              <p>接入设备数量</p>
              <p class="text">{{ deviceTotal }}台</p>
              <div class="line" />
            </el-col>
          </el-row>
        </div>
      </div>
    </el-row>
  </div>
</template>
<script>
// import echarts from 'echarts'
// import { parseTime } from '@/utils'
import resize from '@/components/Charts/mixins/resize'
// import request from '../../utils/request'

export default {
  name: 'Dashboard',
  components: { },
  filters: {
    portFilter(v) {
      const map = {
        0: 'danger',
        1: 'success'
      }
      return map[status]
    }
  },
  mixins: [resize],
  data() {
    return {
      nodeattrs: [],
      intervalId: -1,
      welcomeMessage: '0分钟0秒',
      todayIp: 0,
      todayVisit: 0,
      totalVisit: 0,
      chart: null,
      startTime: new Date(), // 系统启动时间
      runningTime: '0分钟0秒', // 系统运行时长
      dataInPerSecond: 0, // 上行 Topics
      dataOutPerSecond: 0, // 下行 Topics
      infoShould: 345, // 信息使用量
      infoTotal: 500, // 信息总数
      deviceTotal: 340, // 接入设备数量和
      modbus: false, // 连接类型 modbus
      bacnet: true // 连接类型 Bacnet
    }
  },
  computed: {
    user() {
      return this.$store.state.account.user
    },
    avatar() {
      return require(`@/assets/avatar/${this.user.avatar}`)
    }
  },
  destroyed() {
    if (this.intervalId) { clearInterval(this.intervalId) }
  },
  mounted() {
    // request.getDslink(-1)
    this.welcomeMessage = this.welcome()
    this.initIndexData()
  },
  methods: {
    resolveIcon(icon) {
      return require(`@/assets/icons/${icon}`)
    },
    welcome() {
      const date = new Date()
      const hour = date.getHours()
      const time = hour < 6 ? this.$t('common.goodMorning') : (hour <= 11 ? this.$t('common.goodMorning') : (hour <= 13 ? this.$t('common.goodAfternoon') : (hour <= 18 ? this.$t('common.goodAfternoon') : this.$t('common.goodEvening'))))
      const welcomeArr = [
        this.$t('common.randomMessage.a'),
        this.$t('common.randomMessage.b')
      ]
      const index = Math.floor((Math.random() * welcomeArr.length))
      return `${time}, ${this.user.username}, ${welcomeArr[index]}`
    },

    initIndexData() {
      console.log(this.$link)
      setInterval(() => {
        // 获取系统启动时间
        this.getAttrValue('/sys/startTime').then(res => {
          this.startTime = res
          // 计算时长
          this.getRuningTime(res)
        })
        // 获取上行 Topics
        this.getAttrValue('/sys/dataInPerSecond').then(res => {
          this.dataInPerSecond = res
        })
        // 获取下行 Topics
        this.getAttrValue('/sys/dataOutPerSecond').then(res => {
          this.dataOutPerSecond = res
        })
      }, 1000)

      this.$get('api/about').then((r) => {
      })
    },
    view(row, index) {
      this.$link.requester.subscribeOnce(row.remotePath).then(rnode => {
        row.nodevalue = rnode.value
        this.$set(this.nodeattrs, index, row)
      })
    },
    // subscribe 更新频率高
    viewSubscribe(row, index) {
      // var row
      this.$link.requester.subscribe(row.remotePath, (data) => {
        console.log(data)
        row.nodevalue = data.value
        this.$set(this.nodeattrs, index, row)
      })
    },
    // 获取属性值
    getAttrValue(remotePath) {
      return new Promise((resolve) => {
        this.$link.requester.subscribeOnce(remotePath).then(rnode => {
          resolve(rnode.value)
        })
      })
    },
    // 计算系统运行时长
    getRuningTime(startTime) {
      const dateBegin = new Date(startTime) // 入场时间
      const dateEnd = new Date() // 现在的时间
      const dateDiff = dateEnd.getTime() - dateBegin.getTime() // 时间差的毫秒数
      const dayDiff = Math.floor(dateDiff / (24 * 3600 * 1000)) // 计算出相差天数
      const leave1 = dateDiff % (24 * 3600 * 1000) // 计算天数后剩余的毫秒数
      const hours = Math.floor(leave1 / (3600 * 1000)) // 计算出小时数

      // 计算相差分钟数
      const leave2 = leave1 % (3600 * 1000) // 计算小时数后剩余的毫秒数
      const minutes = Math.floor(leave2 / (60 * 1000)) // 计算相差分钟数

      // 计算相差秒数
      const leave3 = leave2 % (60 * 1000) // 计算分钟数后剩余的毫秒数
      const seconds = Math.round(leave3 / 1000)
      if (dayDiff > 0) {
        this.runningTime = dayDiff + '天' + hours + '小时' + minutes + '分钟' + seconds + '秒'
      } else if (hours > 0) {
        this.runningTime = hours + '小时' + minutes + '分钟' + seconds + '秒'
      } else {
        this.runningTime = minutes + '分钟' + seconds + '秒'
      }
    }

  }
}
</script>
<style lang="scss">
.main {
  .el-card {
    border: none;
    border-radius: 2px;
  }
  .el-table.server-table {
    th {
      height: 2.7rem;
      padding: 7px 0;
      border-right: none;
    }
    td {
      padding: 7px 0;
      border-right: none;
    }
  }
  .count-header {
    padding-left: 1rem;
    height: 120px;
    line-height: 120px;
    text-align: left;
    vertical-align: center;
    img {
      width: 3.8rem;
      margin-top: 1.8rem;
      vertical-align: top;
    }
    span {
      font-size: 15px;
      color: #606266;
      font-weight: 600;
      &.des {
        margin-left: 9px;
      }
    }
  }
  .todayIp {
    color: #27c6da !important;
  }
  .todayVisit {
    color: #fc573b !important;
  }
  .totalVisit {
    color: #be63f9 !important;
  }
}
</style>
<style lang="scss" scoped>
.main {
  padding: 10px;
  .app-container {
    margin: 0 0 10px 0;
    .count-header {
      .run {
        color: #42b983;
      }
    }
  }
  .user-container {
    padding: 15px;
  }
  .user-wrapper {
    width: 100%;
    display: inline-block;
    .user-header {
      display: inline-block;
      vertical-align: middle;
      img {
        width: 5rem;
        margin: 0.5rem 1rem;
        border-radius: 50%;
      }
    }
    .user-info {
      display: inline-block;
      vertical-align: middle;
      .random-message {
        font-size: 1rem;
        margin-bottom: 0.5rem;
        color: #333;
      }
      .user-dept,
      .user-login-info {
        color: rgba(0, 0, 0, 0.45);
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        line-height: 1.1rem;
      }
    }
  }
  .user-visits {
    text-align: center;
    padding-right: 2rem;
    margin-top: 1rem;
    vertical-align: middle;
    .num {
      font-weight: 600;
    }
  }
  .project-wrapper {
    padding: 0;
    .project-header {
      padding: 18px;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      td {
        width: 50%;
        border-top: 1px solid #f1f1f1;
        border-bottom: 1px solid #f1f1f1;
        padding: 0.7rem;
        .project-avatar-wrapper {
          display: inline-block;
          float: left;
          margin-right: 0.7rem;
          .project-avatar {
            color: #42b983;
            background-color: #d6f8b8;
          }
        }
        &:nth-child(odd) {
          border-right: 1px solid #f1f1f1;
        }
      }
    }
    .project-detail {
      display: inline-block;
      float: left;
      text-align: left;
      width: 75%;
      .project-name {
        font-size: 0.9rem;
        margin-top: -2px;
        font-weight: 600;
      }
      .project-desc {
        color: rgba(0, 0, 0, 0.45);
        p {
          margin: 5px 0 0 0;
          font-size: 0.85rem;
          line-height: 1.4rem;
          white-space: normal;
        }
      }
    }
  }
  .info {
    text-align: center;
    color: #454545;
    .graphics {
      display: flex;
      width: 67rem;
      margin: 0 auto;
      padding-top: 9rem;
      .icon {
        p {
          font-weight: 400;
          font-size: 1.2rem;
        }
        i {
          display: inline-block;
          width: 14rem;
          height: 11rem;
          background-size: cover;
          background-repeat: no-repeat;
        }
        .device {
          background-image: url("../../assets/icons/device.png");
        }
        .route {
          background-image: url("../../assets/icons/route.png");
        }
        .clouds {
          background-image: url("../../assets/icons/clouds.png");
        }
      }
      .speed,
      .type {
        width: 17rem;
        margin-top: 2rem;
        p {
          font-size: 1rem;
          color: #7d7d7d;
          padding-bottom: 1rem;
          margin: 1rem 1.3rem;
          &:first-child {
            border-bottom: 2px solid #189fff;
          }
          .el-icon-top,
          .el-icon-bottom {
            color: #189fff;
          }
          span.unit {
            color: #ccc;
            font-size: 1rem;
          }
        }
        .run {
          color: #189fff;
        }
      }
      .type {
        margin-top: 0.5rem;
        p {
          span {
            display: inline-block;
            padding: 10px;
            border: 1px solid #7d7d7d;
            border-radius: 5px;
          }
          &:first-child {
            border-bottom: 2px solid #7d7d7d;
          }
          &:last-child {
            border-top: 2px solid #7d7d7d;
            padding-top: 1rem;
          }
        }
        .run {
          color: #189fff;
          span {
            display: inline-block;
            padding: 10px;
            border: 1px solid #189fff;
          }
          &:first-child {
            border-bottom: 2px solid #189fff;
          }
          &:last-child {
            border-top: 2px solid #189fff;
          }
        }
      }
    }
    .infoTotal {
      font-weight: 400;
      font-size: 1.3rem;
      margin: 5rem 0;
    }
    .el-row {
      width: 40rem;
      margin: 0 auto;
      .el-col {
        position: relative;
        p {
          font-size: 1rem;
          &:last-child {
            color: #928e8e;
          }
        }
        .text {
            color: #928e8e;
        }
        .line {
          height: 16px;
          width: 1px;
          background-color: #928e8e;
          position: absolute;
          top: 40%;
          left: 0;
        }
      }
    }
  }
  @media screen and (max-width: 1366px) {
    .user-info {
      max-width: 25rem;
    }
    .info {
      .graphics {
        width: 100%;
      }
    }
  }
  @media screen and (max-width: 1300px) {
    .user-info {
      max-width: 19rem;
    }
    .info {
      .graphics {
        width: 100%;
      }
    }
  }

  @media screen and (max-width: 1120px) {
    .user-info {
      max-width: 17rem;
    }
    .info {
      .graphics {
        width: 100%;
        .speed,
        .type {
          p {
            font-size: 1rem;
          }
        }
      }
    }
  }
  @media screen and (max-width: 920px) {
    .info {
      .graphics {
        width: 34rem;
        .speed,
        .type {
          width: 10rem;
          margin-top: 0;
          p {
            font-size: 1rem;
          }
        }
        .icon {
          i {
            width: 7rem;
            height: 6rem;
          }
          p {
            font-size: 1rem;
          }
        }
      }
      .infoTotal {
        font-size: 1.2rem;
      }
      .el-row {
        width: 74%;
      }
    }
  }
  @media screen and (max-width: 500px) {
    .info {
      .graphics {
        width: 400px;
        .speed,
        .type {
          width: 10rem;
          margin-top: 0;
          p {
            font-size: 0.8rem;
            .unit {
              display: none;
            }
          }
        }
        .icon {
          i {
            width: 4rem;
            height: 3rem;
          }
          p {
            font-size: 0.8rem;
          }
        }
      }
      .infoTotal {
        font-size: 1rem;
      }
      .el-row {
        width: 100%;
      }
    }
  }
}
</style>
