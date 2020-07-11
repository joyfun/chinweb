<template>
  <el-dialog
    :title="title"
    :width="width"
    top="50px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :visible.sync="isVisible"
  >
    <el-form ref="form" size="small" :model="param" :rules="rules" label-position="left" label-width="180px">
      <el-form-item v-for="item in invokeAttr" :key="item.name" :label="$t('links[\''+item.name+'\']')" :prop="item.name">
        <div>

          <el-select v-if="item.type=='enum'" v-model="param[item.name]" placeholder="" style="width:100%">
            <el-option
              v-for="(option,index) in item.enums"
              :key="index"
              :label="option"
              :value="option"
            />
          </el-select>
          <el-switch
            v-else-if="item.type=='bool'"
            v-model="param[item.name]"
          />
          <el-input v-else v-model="param[item.name]" />
        </div>

      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button
        type="warning"
        plain
        :loading="buttonLoading"
        @click="isVisible = false"
      >{{ $t('common.cancel') }}</el-button>
      <el-button
        type="primary"
        plain
        :loading="buttonLoading"
        @click="submitForm"
      >{{ $t('common.confirm') }}</el-button>
    </div>
  </el-dialog>
</template>
<script>
// validURL
import { isIntegerGreaterThanZero } from '@/utils/my-validate'

export default {
  name: 'NodeParam',
  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    remoteNode: {
      type: Object,
      default: function() {
        return null
      }
    },
    nodeParams: {
      type: Object,
      default: function() {
        return null
      }
    },
    invokeAttr: {
      type: Array,
      default: function() {
        return []
      }
    }
  },
  data() {
    return {
      screenWidth: 0,
      dept: {},
      param: {},
      buttonLoading: false,
      width: this.initWidth(),
      rules: {
        port: [
          {
            required: true,
            message: this.$t('rules.require'),
            trigger: 'blur'
          },
          {
            validator: (rule, value, callback) => {
              if (!isIntegerGreaterThanZero(value)) {
                callback(new Error(this.$t('rules.invalidInteger')))
              } else if (value > 65535) {
                callback(new Error(this.$t('rules.invalidatePort')))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      },
      grantTypes: [
        { type: 'modbus', prot: 502 },
        { type: 'bacnet', port: 47808 }
      ]
    }
  },
  computed: {
    isVisible: {
      get() {
        return this.dialogVisible
      },
      set() {
        this.close()
        this.reset()
      }
    }
  },
  watch: {
    isVisible(val) {
      if (val) {
        this.param = this.getNodeParams(this.remoteNode)
        // console.log(this.remoteNode)
      }
    }
  },
  mounted() {
    window.onresize = () => {
      return (() => {
        this.width = this.initWidth()
      })()
    }
  },
  methods: {
    getNodeParams(rnode) {
      console.log(rnode)
      var param = {}
      if (rnode && rnode.remotePath) {
        var params = rnode.getConfig('$params')
        if (params) {
          params.forEach((element, index) => {
            if (element.default !== undefined) {
              param[element.name] = element.default
            } else if (this.invokeAttr[index].enums) {
              param[element.name] = this.invokeAttr[index].enums[0]
            }
          })
        }
      }
      return param
    },
    initWidth() {
      this.screenWidth = document.body.clientWidth
      if (this.screenWidth < 991) {
        return '90%'
      } else if (this.screenWidth < 1400) {
        return '45%'
      } else {
        return '800px'
      }
    },
    initClient() {
      return {}
    },
    submitForm() {
      const { requester } = this.$link
      console.log(this.remoteNode)
      console.log(this.param)
      requester.invokeOnce(this.remoteNode.remotePath, this.param).then(resp => {
        console.log(resp)
        if (resp.error) {
          this.$message({
            message: resp.error,
            type: 'warning'
          })
        } else {
          this.$emit('close')
          this.$emit('updateParent', this.remoteNode.remotePath)
        }
      })
    },
    close() {
      this.$emit('close')
    },
    updateParent() {
      this.$emit('updateParent', this.remoteNode.remotePath)
    },
    reset() {
      this.$refs.form.clearValidate()
      this.$refs.form.resetFields()
    }
  }
}
</script>
