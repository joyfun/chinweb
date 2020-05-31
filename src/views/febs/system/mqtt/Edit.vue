<template>
  <div class="app-container">
    <el-form ref="form" :model="mqtt" label-position="right" label-width="100px">
      <el-form-item :label="$t('mqtt.name')" prop="name">
        <el-input v-model="mqtt.host" />
      </el-form-item>
      <el-form-item label="活动名称" prop="host">
        <el-input v-model="mqtt.host" />
      </el-form-item>
      <el-form-item :label="$t('mqtt.port')" prop="port">
        <el-input v-model="mqtt.port" />
      </el-form-item>
      <el-form-item :label="$t('mqtt.user')" prop="user">
        <el-input v-model="mqtt.user" />
      </el-form-item>
      <el-form-item :label="$t('mqtt.password')" prop="password">
        <el-input v-model="mqtt.password" />
      </el-form-item>
      <el-form-item :label="$t('mqtt.clientId')" prop="clientId">
        <el-input v-model="mqtt.clientID" />
      </el-form-item>
      <div slot="footer" class="dialog-footer">
        <el-button type="warning" plain :loading="buttonLoading" @click="isVisible = false">
          {{ $t('common.cancel') }}
        </el-button>
        <el-button type="primary" plain :loading="buttonLoading" @click="submitForm">
          {{ $t('common.confirm') }}
        </el-button>
      </div>
    </el-form>

  </div>
</template>
<script>
// import { validMobile } from '@/utils/my-validate'
// import Treeselect from '@riophae/vue-treeselect'
// import '@riophae/vue-treeselect/dist/vue-treeselect.css'

export default {
  name: 'MqttEdit',
  //   components: { Treeselect },
  props: {
    dialogVisible: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      initFlag: false,
      buttonLoading: false,
      screenWidth: 0,
      width: this.initWidth(),
      depts: [],
      roles: [],
      deptTree: [],
      mqtt: {
      }
    }
  },
  computed: {
    isVisible: {
      get() {
        return true
      },
      set() {
        this.close()
        this.reset()
      }
    }
  },
  mounted() {
    this.initConfig()
    // this.initRoles()
    window.onresize = () => {
      return (() => {
        this.width = this.initWidth()
      })()
    }
  },
  methods: {
    initConfig() {
      this.$get('api/mqtt').then((r) => {
        this.mqtt = r.data
      }).catch((error) => {
        console.error(error)
        this.$message({
          message: this.$t('tips.getDataFail'),
          type: 'error'
        })
      })
    },
    initWidth() {
      this.screenWidth = document.body.clientWidth
      if (this.screenWidth < 991) {
        return '90%'
      } else if (this.screenWidth < 1400) {
        return '70%'
      } else {
        return '1000px'
      }
    },
    close() {
      this.$emit('close')
    },
    submitForm() {
    //  98
    },
    reset() {
      // 先清除校验，再清除表单，不然有奇怪的bug
      this.$refs.form.clearValidate()
      this.$refs.form.resetFields()
      this.user = this.initMqtt()
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
