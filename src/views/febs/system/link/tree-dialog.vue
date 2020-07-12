<template>
  <el-dialog
    :title="title"
    top="50px"
    :modal="modal"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :visible.sync="isVisible"
  >
    <el-tree
      ref="nodeTree"
      node-key="remotePath"
      :load="readNode"
      :check-strictly="true"
      :props="treeProps"
      accordion
      lazy
      highlight-current
      :filter-node-method="filterNode"
      @node-click="nodeClick"
    >
      <span slot-scope="{ node }">
        <span>{{ node.label }}</span>
      </span>
    </el-tree>
    <div slot="footer" class="dialog-footer">
      <el-button
        type="warning"
        plain
        :loading="buttonLoading"
        @click="close"
      >{{ $t('common.cancel') }}</el-button>
      <el-button
        type="primary"
        plain
        :loading="buttonLoading"
        @click="submit"
      >{{ $t('common.confirm') }}</el-button>
    </div>
  </el-dialog>
</template>
<script>

export default {
  name: 'TreeDialog',
  props: {
    title: {
      type: String,
      default: '树形选择'
    },
    refName: {
      type: String,
      default: ''
    },
    modal: {
      type: Boolean,
      default: true
    },
    treeDialogVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      treeProps: {
        children: 'subNode',
        label(data, node) {
          return data.name
        }
      },
      buttonLoading: false,
      checkNode: ''
    }
  },
  computed: {
    isVisible: {
      get() {
        return this.treeDialogVisible
      },
      set() {
        console.log('close actiuon')
        this.close()
      }
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    filterNode(value, data) {
      if (!value) return true
      return data.label.indexOf(value) !== -1
    },
    readNode(node, resolve) {
      const { requester } = this.$link
      var path = '/downstream'

      if (node && node.data && node.data.remotePath) {
        path = node.data.remotePath
      }
      requester.listOnce(path).then((rnode) => {
        node.data = rnode
        this.nodeChildArr(rnode).then((res) => {
          console.log(res)
          resolve(res)
        })
      })
    },
    nodeChildArr(rnode) {
      return new Promise((resolve) => {
        var tdata = []
        if (rnode.children.size > 0) {
          const arr = Array.from(rnode.children)
          for (let index = 0; index < arr.length; index++) {
            const element = arr[index]
            console.log(element[1])
            if (element[1].get('$is') === 'node' || element[1].get('$is') === 'static' || element[1].get('$is') === 'dsa/link') {
              if (!(element[1].get('$invokable') || element[1].get('$hidden'))) {
                tdata.push(element[1])
              }
            }
          }
        }
        resolve(tdata)
      })
    },
    nodeClick(ndata) {
      this.checkNode = ndata
    },
    // 确定按钮
    submit() {
      // this.buttonLoading = true
      console.log(this.checkNode)
      this.$emit('doSelect', { name: this.refName, node: this.checkNode })
      // this.close()
    }
  }

}
</script>

